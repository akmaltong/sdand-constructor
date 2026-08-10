'use client'

import { setStandModel } from '@pascal-app/nodes'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export type StandImportResult = {
  /** Blob URL of the imported file — also the `asset.src` cache key. */
  url: string
  /** World-space size [w, h, d] of the imported model. */
  dimensions: [number, number, number]
  group: THREE.Group
}

let loader: GLTFLoader | null = null
const getLoader = (): GLTFLoader => {
  if (!loader) {
    loader = new GLTFLoader()
    // DRACO decoder wasm — по умолчанию Three ходит на unpkg CDN.
    const draco = new DRACOLoader()
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(draco)
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader
}

const parseGltf = (buffer: ArrayBuffer, url: string): Promise<THREE.Group> =>
  new Promise((resolve, reject) => {
    getLoader().parse(
      buffer,
      url,
      (gltf) => resolve(gltf.scene),
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })

const round = (value: number, precision = 2): number => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

const prepareGroup = (scene: THREE.Group): void => {
  scene.name = 'stand-import'
  scene.userData.isStandImport = true
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    // Импортированные стенды huge — исключаем из BVH и per-mesh raycast:
    // placement-инструмент считает bounds сверху.
    if (mesh.geometry) mesh.geometry.userData.skipBvh = true
    mesh.userData.skipBvh = true
    mesh.raycast = () => {}
  })
}

/**
 * Parse a user-provided GLB/GLTF, cache the resulting THREE.Group under the
 * blob URL, and report the world-space size. Использует GLTFLoader на main
 * thread — так сохраняются реальные материалы и текстуры GLB.
 */
export async function importStandModel(file: File): Promise<StandImportResult> {
  const url = URL.createObjectURL(file)
  try {
    const buffer = await file.arrayBuffer()
    const scene = await parseGltf(buffer, url)
    prepareGroup(scene)

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const dimensions: [number, number, number] = [
      round(size.x),
      round(size.y),
      round(size.z),
    ]

    setStandModel(url, scene)
    return { url, dimensions, group: scene }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
