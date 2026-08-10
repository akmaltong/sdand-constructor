/**
 * Stand-import worker: parses a GLB/GLTF ArrayBuffer on a worker thread and
 * returns a flattened, GPU-ready mesh atlas (hierarchy baked to world-space
 * transforms, materials reduced to colors). Keeps the main thread responsive
 * when a user imports a large stand model.
 */
import './stand-parse.worker.polyfill'
import { Box3, Color, DoubleSide, Matrix3, Quaternion, Vector2, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type {
  BufferAttribute,
  BufferGeometry,
  InterleavedBufferAttribute,
  Material,
  Mesh,
  Object3D,
  Texture,
} from 'three'

export type StandMeshEntry = {
  name: string
  position: [number, number, number]
  quaternion: [number, number, number, number]
  scale: [number, number, number]
  color: [number, number, number]
  metalness: number
  roughness: number
  emissive: [number, number, number]
  emissiveIntensity: number
  opacity: number
  transparent: boolean
  doubleSided: boolean
  wireframe: boolean
  index: Uint32Array | null
  positionAttr: Float32Array
  normalAttr: Float32Array | null
  uvAttr: Float32Array | null
}

export type StandMeshAtlas = {
  version: 1
  meshCount: number
  vertexCount: number
  meshes: StandMeshEntry[]
  /** World-space bounds of the whole model. */
  min: [number, number, number]
  max: [number, number, number]
}

type StandParseRequest = {
  id: number
  buffer: ArrayBuffer
  url: string
}

type StandParseResult =
  | { id: number; ok: true; atlas: StandMeshAtlas }
  | { id: number; ok: false; error: string }

const ctx = (typeof self !== 'undefined' ? self : globalThis) as unknown as {
  postMessage: (message: StandParseResult, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<StandParseRequest>) => void) | null
}

type MaterialInfo = {
  color: Color
  emissive: Color | undefined
  emissiveIntensity: number
  metalness: number
  roughness: number
  opacity: number
  transparent: boolean
  doubleSided: boolean
  wireframe: boolean
}

/**
 * Sample the average colour from a Texture by drawing it to an OffscreenCanvas
 * and reading the pixel data. Falls back to `fallback` if the texture
 * isn't ready or unreadable.
 */
const sampleTextureColor = (texture: Texture | null, fallback: Color): Color => {
  if (!texture || !texture.image) return fallback

  const img = texture.image as ImageBitmap | OffscreenCanvas | HTMLCanvasElement
  const width = img.width ?? (img as ImageBitmap).width
  const height = img.height ?? (img as ImageBitmap).height

  if (!width || !height) return fallback

  try {
    const offscreen = new OffscreenCanvas(width, height)
    const c2d = offscreen.getContext('2d')
    if (!c2d) return fallback

    c2d.drawImage(img as CanvasImageSource, 0, 0, width, height)
    const imageData = c2d.getImageData(0, 0, width, height)
    let r = 0, g = 0, b = 0
    const len = imageData.data.length
    for (let i = 0; i < len; i += 4) {
      r += imageData.data[i] ?? 0
      g += imageData.data[i + 1] ?? 0
      b += imageData.data[i + 2] ?? 0
    }
    const count = len / 4
    return new Color(r / count / 255, g / count / 255, b / count / 255)
  } catch {
    return fallback
  }
}

/** Polling wait: GLTFLoader may resolve before ImageBitmap decode finishes. */
const waitForTextures = async (textures: Texture[]): Promise<void> => {
  const deadline = performance.now() + 5000
  while (performance.now() < deadline) {
    if (textures.every((t) => !!t.image)) return
    await new Promise<void>((resolve) => setTimeout(resolve, 50))
  }
}

const collectTextures = (root: Object3D): Texture[] => {
  const set = new Set<Texture>()
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of materials) {
      const props = m as unknown as { map?: Texture | null }
      if (props.map) set.add(props.map)
    }
  })
  return Array.from(set)
}

const readMaterial = (material: Material | Material[]): MaterialInfo => {
  const m = (Array.isArray(material) ? material[0] ?? material : material) as Material
  const props = m as unknown as {
    color?: Color
    emissive?: Color
    emissiveIntensity?: number
    metalness?: number
    roughness?: number
    opacity?: number
    transparent?: boolean
    wireframe?: boolean
    map?: Texture | null
  }

  const baseColor = props.color ?? new Color(1, 1, 1)
  // If the material has an albedo (map) texture, sample its average color
  const color = props.map ? sampleTextureColor(props.map, baseColor) : baseColor

  return {
    color,
    emissive: props.emissive,
    emissiveIntensity: props.emissiveIntensity ?? 0,
    metalness: props.metalness ?? 0,
    roughness: props.roughness ?? 1,
    opacity: props.opacity ?? 1,
    transparent: props.transparent ?? false,
    doubleSided: m.side === DoubleSide,
    wireframe: props.wireframe ?? false,
  }
}

type MaterialBucket = {
  info: MaterialInfo
  positions: number[]
  normals: number[]
  uvs: number[]
  indices: number[]
  hasNormals: boolean
  hasUvs: boolean
  vertexCount: number
}

const tempVec3 = new Vector3()
const tempNormalVec3 = new Vector3()
const normalMatrix = new Matrix3()

export const collectAtlas = (root: Object3D): StandMeshAtlas => {
  const atlas: StandMeshAtlas = {
    version: 1,
    meshCount: 0,
    vertexCount: 0,
    meshes: [],
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  }

  // Group sub-meshes by material property key to merge geometries into few draw calls
  const buckets = new Map<string, MaterialBucket>()

  const visit = (object: Object3D): void => {
    if ((object as Mesh).isMesh) {
      const mesh = object as Mesh
      const geometry = mesh.geometry as BufferGeometry
      const posAttr = geometry.getAttribute('position')
      if (posAttr && posAttr.count >= 3) {
        if (!geometry.getAttribute('normal')) {
          geometry.computeVertexNormals()
        }

        mesh.updateWorldMatrix(true, true)
        normalMatrix.getNormalMatrix(mesh.matrixWorld)

        const normalAttr = geometry.getAttribute('normal')
        const uvAttr = geometry.getAttribute('uv')
        const indexAttr = geometry.getIndex()

        const info = readMaterial(mesh.material)
        const matKey = `${info.color.getHexString()}_${info.metalness}_${info.roughness}_${info.emissive?.getHexString() ?? '000000'}_${info.emissiveIntensity}_${info.opacity}_${info.transparent}_${info.doubleSided}_${info.wireframe}`

        let bucket = buckets.get(matKey)
        if (!bucket) {
          bucket = {
            info,
            positions: [],
            normals: [],
            uvs: [],
            indices: [],
            hasNormals: Boolean(normalAttr),
            hasUvs: Boolean(uvAttr),
            vertexCount: 0,
          }
          buckets.set(matKey, bucket)
        }

        const baseIndex = bucket.vertexCount
        const vCount = posAttr.count

        for (let i = 0; i < vCount; i++) {
          // Transform local vertex position to world space
          tempVec3.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)).applyMatrix4(mesh.matrixWorld)
          bucket.positions.push(tempVec3.x, tempVec3.y, tempVec3.z)

          atlas.min[0] = Math.min(atlas.min[0], tempVec3.x)
          atlas.min[1] = Math.min(atlas.min[1], tempVec3.y)
          atlas.min[2] = Math.min(atlas.min[2], tempVec3.z)
          atlas.max[0] = Math.max(atlas.max[0], tempVec3.x)
          atlas.max[1] = Math.max(atlas.max[1], tempVec3.y)
          atlas.max[2] = Math.max(atlas.max[2], tempVec3.z)

          // Transform normal to world space
          if (normalAttr) {
            tempNormalVec3.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i)).applyMatrix3(normalMatrix).normalize()
            bucket.normals.push(tempNormalVec3.x, tempNormalVec3.y, tempNormalVec3.z)
          } else {
            bucket.normals.push(0, 1, 0)
          }

          if (uvAttr) {
            bucket.uvs.push(uvAttr.getX(i), uvAttr.getY(i))
          } else if (bucket.hasUvs) {
            bucket.uvs.push(0, 0)
          }
        }

        if (indexAttr) {
          for (let j = 0; j < indexAttr.count; j++) {
            bucket.indices.push(indexAttr.getX(j) + baseIndex)
          }
        } else {
          for (let j = 0; j < vCount; j++) {
            bucket.indices.push(j + baseIndex)
          }
        }

        bucket.vertexCount += vCount
      }
    }

    for (const child of object.children) {
      visit(child)
    }
  }

  visit(root)

  // Construct consolidated GPU-ready mesh entries from buckets
  let groupIdx = 0
  for (const bucket of buckets.values()) {
    if (bucket.vertexCount === 0) continue

    const entry: StandMeshEntry = {
      name: `stand-part-${++groupIdx}`,
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      scale: [1, 1, 1],
      color: [bucket.info.color.r, bucket.info.color.g, bucket.info.color.b],
      metalness: bucket.info.metalness,
      roughness: bucket.info.roughness,
      emissive: [bucket.info.emissive?.r ?? 0, bucket.info.emissive?.g ?? 0, bucket.info.emissive?.b ?? 0],
      emissiveIntensity: bucket.info.emissiveIntensity,
      opacity: bucket.info.opacity,
      transparent: bucket.info.transparent,
      doubleSided: bucket.info.doubleSided,
      wireframe: bucket.info.wireframe,
      index: new Uint32Array(bucket.indices),
      positionAttr: new Float32Array(bucket.positions),
      normalAttr: bucket.normals.length > 0 ? new Float32Array(bucket.normals) : null,
      uvAttr: bucket.uvs.length > 0 ? new Float32Array(bucket.uvs) : null,
    }

    atlas.meshes.push(entry)
    atlas.meshCount += 1
    atlas.vertexCount += bucket.vertexCount
  }

  return atlas
}

ctx.onmessage = (event: MessageEvent<StandParseRequest>) => {
  const { id, buffer, url } = event.data

  const fail = (error: unknown): void => {
    ctx.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  try {
    const loader = new GLTFLoader()
    loader.setDRACOLoader(new DRACOLoader())
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.parse(
      buffer,
      url,
      async (gltf) => {
        // Sdand: без ожидания текстур MeshStandardMaterial.map ещё пустой,
        // baseColor остаётся дефолтным белым и вся модель едет «в мел».
        await waitForTextures(collectTextures(gltf.scene))
        const atlas = collectAtlas(gltf.scene)
        if (atlas.meshCount === 0) {
          ctx.postMessage({ id, ok: false, error: 'В модели нет геометрии.' })
          return
        }
        const transfer: Transferable[] = []
        for (const mesh of atlas.meshes) {
          if (mesh.index) transfer.push(mesh.index.buffer)
          transfer.push(mesh.positionAttr.buffer)
          if (mesh.normalAttr) transfer.push(mesh.normalAttr.buffer)
          if (mesh.uvAttr) transfer.push(mesh.uvAttr.buffer)
        }
        ctx.postMessage({ id, ok: true, atlas }, transfer)
      },
      (error) => {
        fail(error)
      },
    )
  } catch (error) {
    fail(error)
  }
}
