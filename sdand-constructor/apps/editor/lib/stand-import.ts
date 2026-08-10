'use client'

import { setStandModel } from '@pascal-app/nodes'
import * as THREE from 'three'
import type { StandMaterialData, StandMeshAtlas, StandMeshEntry } from './stand-parse.worker'

type WorkerResponse = { id: number; ok: true; atlas: StandMeshAtlas } | { id: number; ok: false; error: string }

export type StandImportResult = {
  url: string
  dimensions: [number, number, number]
  group: THREE.Group
}

let worker: Worker | null = null
let nextRequestId = 0
const pending = new Map<number, { resolve: (atlas: StandMeshAtlas) => void; reject: (error: Error) => void }>()

const getWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL('./stand-parse.worker', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const request = pending.get(event.data.id)
      if (!request) return
      pending.delete(event.data.id)
      if (event.data.ok) request.resolve(event.data.atlas)
      else request.reject(new Error(event.data.error))
    }
    worker.onerror = (event) => {
      for (const request of pending.values()) request.reject(new Error(event.message || 'Worker failed'))
      pending.clear()
    }
  }
  return worker
}

const parseStandFile = (buffer: ArrayBuffer, url: string): Promise<StandMeshAtlas> =>
  new Promise((resolve, reject) => {
    const id = ++nextRequestId
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, buffer, url }, [buffer])
  })

const buildMaterial = (data: StandMaterialData): THREE.MeshStandardMaterial => {
  let map: THREE.Texture | null = null
  if (data.mapBitmap) {
    map = new THREE.CanvasTexture(data.mapBitmap)
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.flipY = false
    map.needsUpdate = true
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(data.color[0], data.color[1], data.color[2]),
    metalness: data.metalness,
    roughness: data.roughness,
    emissive: new THREE.Color(data.emissive[0], data.emissive[1], data.emissive[2]),
    emissiveIntensity: data.emissiveIntensity,
    opacity: data.opacity,
    transparent: data.transparent,
    side: data.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    wireframe: data.wireframe,
    map,
  })
}

const buildStandMesh = (entry: StandMeshEntry, material: THREE.Material): THREE.Mesh => {
  const geometry = new THREE.BufferGeometry()
  if (entry.index) geometry.setIndex(new THREE.BufferAttribute(entry.index, 1))
  geometry.setAttribute('position', new THREE.BufferAttribute(entry.positionAttr, 3))
  if (entry.normalAttr) geometry.setAttribute('normal', new THREE.BufferAttribute(entry.normalAttr, 3))
  if (entry.uvAttr) geometry.setAttribute('uv', new THREE.BufferAttribute(entry.uvAttr, 2))
  geometry.computeBoundingSphere()
  geometry.computeBoundingBox()
  geometry.userData.skipBvh = true

  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.skipBvh = true
  mesh.raycast = () => {}
  return mesh
}

// Chunked mesh construction — main thread yields via rAF каждые CHUNK меш.
const CHUNK = 200
const buildStandGroupAsync = async (atlas: StandMeshAtlas): Promise<THREE.Group> => {
  const group = new THREE.Group()
  group.name = 'stand-import'
  group.userData.isStandImport = true

  const materials = atlas.materials.map(buildMaterial)

  for (let i = 0; i < atlas.meshes.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, atlas.meshes.length)
    for (let j = i; j < end; j++) {
      const entry = atlas.meshes[j]!
      const material = materials[entry.materialIndex] ?? materials[0]!
      group.add(buildStandMesh(entry, material))
    }
    if (end < atlas.meshes.length) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  }

  group.updateMatrixWorld(true)
  return group
}

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export async function importStandModel(file: File): Promise<StandImportResult> {
  const url = URL.createObjectURL(file)
  try {
    const buffer = await file.arrayBuffer()
    const atlas = await parseStandFile(buffer, url)
    const group = await buildStandGroupAsync(atlas)
    setStandModel(url, group)

    const dimensions: [number, number, number] = [
      round(atlas.max[0] - atlas.min[0]),
      round(atlas.max[1] - atlas.min[1]),
      round(atlas.max[2] - atlas.min[2]),
    ]
    return { url, dimensions, group }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
