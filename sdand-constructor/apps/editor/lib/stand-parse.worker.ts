/**
 * Stand-import worker: parses GLB/GLTF ArrayBuffer off the main thread,
 * returns a flattened, GPU-ready mesh atlas with per-material info AND
 * transferable ImageBitmap for the albedo texture (if any). The main thread
 * rebuilds real MeshStandardMaterial + CanvasTexture from those bitmaps.
 */
import './stand-parse.worker.polyfill'
import { Box3, DoubleSide, Matrix3, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type {
  BufferGeometry,
  Material,
  Mesh,
  Object3D,
  Texture,
} from 'three'

export type StandMaterialData = {
  color: [number, number, number]
  metalness: number
  roughness: number
  emissive: [number, number, number]
  emissiveIntensity: number
  opacity: number
  transparent: boolean
  doubleSided: boolean
  wireframe: boolean
  mapBitmap: ImageBitmap | null
}

export type StandMeshEntry = {
  materialIndex: number
  index: Uint32Array | null
  positionAttr: Float32Array
  normalAttr: Float32Array | null
  uvAttr: Float32Array | null
}

export type StandMeshAtlas = {
  version: 2
  materials: StandMaterialData[]
  meshes: StandMeshEntry[]
  min: [number, number, number]
  max: [number, number, number]
}

type StandParseRequest = { id: number; buffer: ArrayBuffer; url: string }
type StandParseResult =
  | { id: number; ok: true; atlas: StandMeshAtlas }
  | { id: number; ok: false; error: string }

const ctx = (typeof self !== 'undefined' ? self : globalThis) as unknown as {
  postMessage: (message: StandParseResult, transfer?: Transferable[]) => void
  onmessage: ((event: MessageEvent<StandParseRequest>) => void) | null
}

const waitForTextures = async (textures: Texture[]): Promise<void> => {
  const deadline = performance.now() + 8000
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

const extractBitmap = (texture: Texture | null | undefined): ImageBitmap | null => {
  if (!texture) return null
  const img = texture.image as
    | ImageBitmap
    | { _bitmap?: ImageBitmap; bitmap?: ImageBitmap }
    | null
  if (!img) return null
  if ((img as ImageBitmap).close && (img as ImageBitmap).width) return img as ImageBitmap
  return (img as { _bitmap?: ImageBitmap; bitmap?: ImageBitmap })._bitmap
    ?? (img as { _bitmap?: ImageBitmap; bitmap?: ImageBitmap }).bitmap
    ?? null
}

const materialKeyFor = (m: Material): string => {
  const p = m as unknown as {
    color?: { getHexString: () => string }
    map?: Texture | null
    metalness?: number
    roughness?: number
    opacity?: number
    transparent?: boolean
  }
  return `${p.color?.getHexString() ?? 'fff'}_${(p.map as unknown as { uuid?: string })?.uuid ?? 'no'}_${p.metalness ?? 0}_${p.roughness ?? 1}_${p.opacity ?? 1}_${p.transparent ?? false}_${m.side}`
}

const buildMaterialData = (m: Material): StandMaterialData => {
  const p = m as unknown as {
    color?: { r: number; g: number; b: number }
    emissive?: { r: number; g: number; b: number }
    emissiveIntensity?: number
    metalness?: number
    roughness?: number
    opacity?: number
    transparent?: boolean
    wireframe?: boolean
    map?: Texture | null
  }
  return {
    color: [p.color?.r ?? 1, p.color?.g ?? 1, p.color?.b ?? 1],
    metalness: p.metalness ?? 0,
    roughness: p.roughness ?? 1,
    emissive: [p.emissive?.r ?? 0, p.emissive?.g ?? 0, p.emissive?.b ?? 0],
    emissiveIntensity: p.emissiveIntensity ?? 0,
    opacity: p.opacity ?? 1,
    transparent: p.transparent ?? false,
    doubleSided: m.side === DoubleSide,
    wireframe: p.wireframe ?? false,
    mapBitmap: extractBitmap(p.map),
  }
}

const tempVec3 = new Vector3()
const tempNormalVec3 = new Vector3()
const normalMatrix = new Matrix3()

export const collectAtlas = (root: Object3D): StandMaterialData[] extends never ? never : StandMeshAtlas => {
  const atlas: StandMeshAtlas = {
    version: 2,
    materials: [],
    meshes: [],
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  }

  const matKeyToIndex = new Map<string, number>()
  const buckets = new Map<
    number,
    {
      positions: number[]
      normals: number[]
      uvs: number[]
      indices: number[]
      hasUvs: boolean
      vertexCount: number
    }
  >()

  const visit = (object: Object3D): void => {
    if ((object as Mesh).isMesh) {
      const mesh = object as Mesh
      const geometry = mesh.geometry as BufferGeometry
      const posAttr = geometry.getAttribute('position')
      if (posAttr && posAttr.count >= 3) {
        if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()

        mesh.updateWorldMatrix(true, true)
        normalMatrix.getNormalMatrix(mesh.matrixWorld)

        const normalAttr = geometry.getAttribute('normal')
        const uvAttr = geometry.getAttribute('uv')
        const indexAttr = geometry.getIndex()

        const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Material
        const key = materialKeyFor(material)
        let matIdx = matKeyToIndex.get(key)
        if (matIdx === undefined) {
          matIdx = atlas.materials.length
          matKeyToIndex.set(key, matIdx)
          atlas.materials.push(buildMaterialData(material))
        }

        let bucket = buckets.get(matIdx)
        if (!bucket) {
          bucket = {
            positions: [],
            normals: [],
            uvs: [],
            indices: [],
            hasUvs: Boolean(uvAttr),
            vertexCount: 0,
          }
          buckets.set(matIdx, bucket)
        }

        const baseIndex = bucket.vertexCount
        const vCount = posAttr.count

        for (let i = 0; i < vCount; i++) {
          tempVec3.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)).applyMatrix4(mesh.matrixWorld)
          bucket.positions.push(tempVec3.x, tempVec3.y, tempVec3.z)

          atlas.min[0] = Math.min(atlas.min[0], tempVec3.x)
          atlas.min[1] = Math.min(atlas.min[1], tempVec3.y)
          atlas.min[2] = Math.min(atlas.min[2], tempVec3.z)
          atlas.max[0] = Math.max(atlas.max[0], tempVec3.x)
          atlas.max[1] = Math.max(atlas.max[1], tempVec3.y)
          atlas.max[2] = Math.max(atlas.max[2], tempVec3.z)

          if (normalAttr) {
            tempNormalVec3.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i)).applyMatrix3(normalMatrix).normalize()
            bucket.normals.push(tempNormalVec3.x, tempNormalVec3.y, tempNormalVec3.z)
          } else {
            bucket.normals.push(0, 1, 0)
          }

          if (uvAttr) bucket.uvs.push(uvAttr.getX(i), uvAttr.getY(i))
          else if (bucket.hasUvs) bucket.uvs.push(0, 0)
        }

        if (indexAttr) {
          for (let j = 0; j < indexAttr.count; j++) bucket.indices.push(indexAttr.getX(j) + baseIndex)
        } else {
          for (let j = 0; j < vCount; j++) bucket.indices.push(j + baseIndex)
        }

        bucket.vertexCount += vCount
      }
    }
    for (const child of object.children) visit(child)
  }

  visit(root)

  for (const [matIdx, bucket] of buckets) {
    if (bucket.vertexCount === 0) continue
    atlas.meshes.push({
      materialIndex: matIdx,
      index: new Uint32Array(bucket.indices),
      positionAttr: new Float32Array(bucket.positions),
      normalAttr: bucket.normals.length > 0 ? new Float32Array(bucket.normals) : null,
      uvAttr: bucket.uvs.length > 0 ? new Float32Array(bucket.uvs) : null,
    })
  }

  return atlas
}

ctx.onmessage = (event: MessageEvent<StandParseRequest>) => {
  const { id, buffer, url } = event.data
  const fail = (error: unknown): void => {
    ctx.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) })
  }

  try {
    const loader = new GLTFLoader()
    loader.setDRACOLoader(new DRACOLoader())
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.parse(
      buffer,
      url,
      async (gltf) => {
        try {
          await waitForTextures(collectTextures(gltf.scene))
          const atlas = collectAtlas(gltf.scene)
          if (atlas.meshes.length === 0) {
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
          for (const mat of atlas.materials) {
            if (mat.mapBitmap) transfer.push(mat.mapBitmap)
          }
          ctx.postMessage({ id, ok: true, atlas }, transfer)
        } catch (error) {
          fail(error)
        }
      },
      (error) => fail(error),
    )
  } catch (error) {
    fail(error)
  }
}

// Bounds may be handy for main-thread size calculation.
export const boundsBox = (): Box3 => new Box3()
