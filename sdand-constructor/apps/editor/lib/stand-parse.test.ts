import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { collectAtlas } from './stand-parse.worker'

test('collectAtlas merges multiple sub-meshes sharing material keys into consolidated entries', () => {
  const root = new THREE.Group()

  const matRed = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.5 })
  const matBlue = new THREE.MeshStandardMaterial({ color: 0x0000ff, metalness: 0.1, roughness: 0.9 })

  // Add 100 sub-meshes with matRed
  for (let i = 0; i < 100; i++) {
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mesh = new THREE.Mesh(geo, matRed)
    mesh.position.set(i * 2, 0, 0)
    root.add(mesh)
  }

  // Add 50 sub-meshes with matBlue
  for (let i = 0; i < 50; i++) {
    const geo = new THREE.SphereGeometry(1, 8, 8)
    const mesh = new THREE.Mesh(geo, matBlue)
    mesh.position.set(0, i * 2, 0)
    root.add(mesh)
  }

  const atlas = collectAtlas(root)

  // Out of 150 total sub-meshes, we expect exactly 2 merged GPU mesh entries (one for red, one for blue)
  expect(atlas.meshCount).toBe(2)
  expect(atlas.meshes.length).toBe(2)
  expect(atlas.vertexCount).toBeGreaterThan(1000)

  // Verify bounds are calculated correctly
  expect(atlas.min[0]).toBeLessThan(0)
  expect(atlas.max[0]).toBeGreaterThan(190)
})
