'use client'

import { setStandModel } from '@pascal-app/nodes'
import * as THREE from 'three'
import type { StandMeshAtlas, StandMeshEntry } from './stand-parse.worker'

type WorkerResponse = { id: number; ok: true; atlas: StandMeshAtlas } | { id: number; ok: false; error: string }

export type StandImportResult = {
  /** Blob URL of the imported file — also the `asset.src` cache key. */
  url: string
  /** World-space size [w, h, d] of the imported model. */
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
      if (event.data.ok) {
        request.resolve(event.data.atlas)
      } else {
        request.reject(new Error(event.data.error))
      }
    }
    worker.onerror = (event) => {
      for (const request of pending.values()) {
        request.reject(new Error(event.message || 'Worker failed'))
      }
      pending.clear()
    }
  }
  return worker
}

const parseStandFile = (buffer: ArrayBuffer, url: string): Promise<StandMeshAtlas> =>
  new Promise<StandMeshAtlas>((resolve, reject) => {
    const id = ++nextRequestId
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, buffer, url }, [buffer])
  })

const buildStandGroup = (atlas: StandMeshAtlas): THREE.Group => {
  const group = new THREE.Group()
  group.name = 'stand-import'
  group.userData.isStandImport = true

  for (const entry of atlas.meshes) {
    const mesh = buildStandMesh(entry)
    group.add(mesh)
  }

  group.updateMatrixWorld(true)
  return group
}

const buildStandMesh = (entry: StandMeshEntry): THREE.Mesh => {
  const geometry = new THREE.BufferGeometry()
  if (entry.index) {
    geometry.setIndex(new THREE.BufferAttribute(entry.index, 1))
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(entry.positionAttr, 3))
  if (entry.normalAttr) {
    geometry.setAttribute('normal', new THREE.BufferAttribute(entry.normalAttr, 3))
  }
  if (entry.uvAttr) {
    geometry.setAttribute('uv', new THREE.BufferAttribute(entry.uvAttr, 2))
  }
  geometry.computeBoundingSphere()
  geometry.computeBoundingBox()
  // Imported stands are huge — the editor's per-mesh BVH pass must skip them.
  geometry.userData.skipBvh = true

  const materialKey = `${entry.color.join('_')}_${entry.metalness}_${entry.roughness}_${entry.emissive.join('_')}_${entry.emissiveIntensity}_${entry.opacity}_${entry.transparent}_${entry.doubleSided}_${entry.wireframe}`
  let material = materialCache.get(materialKey)
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(entry.color[0], entry.color[1], entry.color[2]),
      metalness: entry.metalness,
      roughness: entry.roughness,
      emissive: new THREE.Color(entry.emissive[0], entry.emissive[1], entry.emissive[2]),
      emissiveIntensity: entry.emissiveIntensity,
      transparent: entry.transparent,
      opacity: entry.opacity,
      side: entry.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      wireframe: entry.wireframe,
    })
    material.name = entry.name || 'stand-material'
    materialCache.set(materialKey, material)
  }

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = entry.name
  mesh.position.fromArray(entry.position)
  mesh.quaternion.fromArray(entry.quaternion)
  mesh.scale.fromArray(entry.scale)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.skipBvh = true
  // Disable per-submesh raycasting: placement tool uses top-level asset bounds
  mesh.raycast = () => {}
  return mesh
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/**
 * Parse a user-provided GLB/GLTF in a worker thread, build the reusable
 * THREE.Group, cache it under the blob URL, and report the world-space size.
 */
export async function importStandModel(file: File): Promise<StandImportResult> {
  const url = URL.createObjectURL(file)
  try {
    const buffer = await file.arrayBuffer()
    const atlas = await parseStandFile(buffer, url)
    const group = buildStandGroup(atlas)
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
