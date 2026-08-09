/**
 * Stand-import worker: parses a GLB/GLTF ArrayBuffer on a worker thread and
 * returns a flattened, GPU-ready mesh atlas (hierarchy baked to world-space
 * transforms, materials reduced to colors). Keeps the main thread responsive
 * when a user imports a large stand model.
 */
import './stand-parse.worker.polyfill'
import { Box3, Color, DoubleSide, Quaternion, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type {
  BufferAttribute,
  BufferGeometry,
  InterleavedBufferAttribute,
  Material,
  Mesh,
  Object3D,
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

const attrToFloat = (
  attr: BufferAttribute | InterleavedBufferAttribute,
): Float32Array => {
  // Interleaved attributes share one backing array with every other
  // attribute — copying it wholesale would pull in foreign components.
  if ((attr as InterleavedBufferAttribute).isInterleavedBufferAttribute) {
    const count = attr.count
    const itemSize = attr.itemSize
    const out = new Float32Array(count * itemSize)
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < itemSize; k++) {
        out[i * itemSize + k] = attr.getComponent(i, k)
      }
    }
    return out
  }
  return new Float32Array(attr.array as Float32Array)
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
  }
  return {
    color: props.color ?? new Color(1, 1, 1),
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

const position = new Vector3()
const quaternion = new Quaternion()
const scale = new Vector3()
const box = new Box3()

const extractMesh = (mesh: Mesh, out: StandMeshAtlas): StandMeshEntry | null => {
  const geometry = mesh.geometry as BufferGeometry
  const posAttr = geometry.getAttribute('position')
  if (!posAttr || posAttr.count < 3) return null

  if (!geometry.getAttribute('normal')) {
    geometry.computeVertexNormals()
  }

  const index = geometry.getIndex()
  const normalAttr = geometry.getAttribute('normal')
  const uvAttr = geometry.getAttribute('uv')
  const positionAttr = attrToFloat(posAttr)

  geometry.computeBoundingBox()
  if (!geometry.boundingBox) return null

  mesh.updateWorldMatrix(true, true)
  mesh.getWorldPosition(position)
  mesh.getWorldQuaternion(quaternion)
  mesh.getWorldScale(scale)

  box.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
  out.min[0] = Math.min(out.min[0], box.min.x)
  out.min[1] = Math.min(out.min[1], box.min.y)
  out.min[2] = Math.min(out.min[2], box.min.z)
  out.max[0] = Math.max(out.max[0], box.max.x)
  out.max[1] = Math.max(out.max[1], box.max.y)
  out.max[2] = Math.max(out.max[2], box.max.z)

  const info = readMaterial(mesh.material)

  return {
    name: mesh.name || 'part',
    position: [position.x, position.y, position.z],
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
    scale: [scale.x, scale.y, scale.z],
    color: [info.color.r, info.color.g, info.color.b],
    metalness: info.metalness,
    roughness: info.roughness,
    emissive: [info.emissive?.r ?? 0, info.emissive?.g ?? 0, info.emissive?.b ?? 0],
    emissiveIntensity: info.emissiveIntensity,
    opacity: info.opacity,
    transparent: info.transparent,
    doubleSided: info.doubleSided,
    wireframe: info.wireframe,
    index: index ? new Uint32Array(index.array) : null,
    positionAttr,
    normalAttr: normalAttr ? attrToFloat(normalAttr) : null,
    uvAttr: uvAttr ? attrToFloat(uvAttr) : null,
  }
}

export const collectAtlas = (root: Object3D): StandMeshAtlas => {
  const atlas: StandMeshAtlas = {
    version: 1,
    meshCount: 0,
    vertexCount: 0,
    meshes: [],
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  }

  const visit = (object: Object3D): void => {
    if ((object as Mesh).isMesh) {
      const entry = extractMesh(object as Mesh, atlas)
      if (entry) {
        atlas.meshes.push(entry)
        atlas.meshCount += 1
        atlas.vertexCount += entry.positionAttr.length / 3
      }
    }
    for (const child of object.children) {
      visit(child)
    }
  }

  visit(root)
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
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.parse(
      buffer,
      url,
      (gltf) => {
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
