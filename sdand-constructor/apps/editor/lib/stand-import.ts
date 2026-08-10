'use client'

import { setStandModel } from '@pascal-app/nodes'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export type StandImportResult = {
  url: string
  dimensions: [number, number, number]
  group: THREE.Group
}

let loader: GLTFLoader | null = null
const getLoader = (): GLTFLoader => {
  if (!loader) {
    loader = new GLTFLoader()
    const draco = new DRACOLoader()
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(draco)
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader
}

// GLTFLoader.parse timeouts после N секунд если DRACO/Meshopt wasm не пришёл.
const parseWithTimeout = (buffer: ArrayBuffer, url: string, timeoutMs = 60000): Promise<THREE.Group> =>
  new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (done) return
      done = true
      reject(new Error(`Парсинг GLB превысил ${timeoutMs / 1000}s (DRACO wasm недоступен?)`))
    }, timeoutMs)

    getLoader().parse(
      buffer,
      url,
      (gltf) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(gltf.scene)
      },
      (error) => {
        if (done) return
        done = true
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
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
    if (mesh.geometry) mesh.geometry.userData.skipBvh = true
    mesh.userData.skipBvh = true
    mesh.raycast = () => {}
  })
}

/**
 * Parse GLB на main thread (как useGLTF для каталога) — сохраняются реальные
 * материалы и текстуры. Yield-им до/после parse чтобы UI успел отрисовать
 * loading-состояние.
 */
export async function importStandModel(file: File): Promise<StandImportResult> {
  const url = URL.createObjectURL(file)
  try {
    const buffer = await file.arrayBuffer()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const scene = await parseWithTimeout(buffer, url)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    prepareGroup(scene)

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const dimensions: [number, number, number] = [round(size.x), round(size.y), round(size.z)]

    setStandModel(url, scene)
    return { url, dimensions, group: scene }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
