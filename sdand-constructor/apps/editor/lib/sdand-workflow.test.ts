import { expect, test } from 'bun:test'
import type { AssetInput } from '@pascal-app/core'
import { resolveSdandPlacementAsset } from './sdand-workflow'

const catalog: AssetInput[] = [
  {
    id: 'podium-1',
    category: 'furniture',
    name: 'Подиум 1x1',
    tags: ['floor', 'stand'],
    thumbnail: '/thumb.png',
    src: 'primitive:box:111111',
    dimensions: [1, 0.1, 1],
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    source: 'library',
  },
  {
    id: 'equipment-1',
    category: 'kitchen',
    name: 'Touch 55"',
    tags: ['floor', 'stand', 'equipment'],
    thumbnail: '/thumb.png',
    src: '/equipment/touch_55.glb',
    dimensions: [0.461, 1.88, 0.763],
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    source: 'library',
  },
]

test('picks a podium preset from the catalog', () => {
  expect(resolveSdandPlacementAsset(catalog, 'podium')?.id).toBe('podium-1')
})

test('picks an equipment preset from the catalog', () => {
  expect(resolveSdandPlacementAsset(catalog, 'equipment')?.id).toBe('equipment-1')
})
