import { expect, test } from 'bun:test'
import { type AnyNode, type AnyNodeId, ScanNode, useScene } from '@pascal-app/core'
import { syncDefaultVenue, VENUE_TAG, type VenueConfig } from './venue-seed'

// `updateNodesAction` batches dirty-marking behind requestAnimationFrame —
// the node update itself applies synchronously via `set()`, but the trailing
// rAF call throws in Node/bun where rAF is undefined.
if (typeof globalThis.requestAnimationFrame !== 'function') {
  ;(globalThis as { requestAnimationFrame?: (cb: () => void) => number }).requestAnimationFrame = (
    cb: () => void,
  ) => setTimeout(cb, 0) as unknown as number
}
if (typeof globalThis.cancelAnimationFrame !== 'function') {
  ;(globalThis as { cancelAnimationFrame?: (id: number) => void }).cancelAnimationFrame = (
    id: number,
  ) => clearTimeout(id)
}

const GOSTINKA: VenueConfig = {
  url: '/venues/SM_GOSTINKA.glb?v=2',
  footprint: { x: -97.7, z: -50.3, width: 201, depth: 91 },
}

function resetScene() {
  const state = useScene.getState()
  state.unloadScene()
  state.loadScene()
}

function firstLevelId(): string | null {
  const nodes = useScene.getState().nodes as Record<string, AnyNode>
  const level = Object.entries(nodes).find(([, n]) => n.type === 'level')
  return level ? level[0] : null
}

function scanNodes(): Record<string, AnyNode> {
  const nodes = useScene.getState().nodes as Record<string, AnyNode>
  return Object.fromEntries(Object.entries(nodes).filter(([, n]) => n.type === 'scan'))
}

test('seeds the venue scan at the origin under the level on an empty scene', () => {
  resetScene()
  const levelId = firstLevelId()
  expect(levelId).not.toBeNull()

  const result = syncDefaultVenue(useScene.getState(), GOSTINKA, [])

  expect(result.created).toBe(true)
  expect(result.nodeId).not.toBeNull()
  expect(result.levelId).toBe(levelId)

  const node = useScene.getState().nodes[result.nodeId as never]
  expect(node.type).toBe('scan')
  expect(node.position).toEqual([0, 0, 0])
  expect(node.parentId).toBe(levelId)
  expect(node.url).toBe(GOSTINKA.url)
  expect(node.metadata?.tag).toBe(VENUE_TAG)
})

test('re-positions an existing tagged venue scan that has a stale position', () => {
  resetScene()
  syncDefaultVenue(useScene.getState(), GOSTINKA, [])
  const scanId = Object.keys(scanNodes())[0]

  useScene.getState().updateNode(scanId as AnyNodeId, { position: [0, 5, 0] })

  const result = syncDefaultVenue(useScene.getState(), GOSTINKA, [])

  expect(result.created).toBe(false)
  const node = useScene.getState().nodes[scanId as never]
  expect(node.position).toEqual([0, 0, 0])
})

test('migrates a legacy untagged venue scan (matching url) to origin + tag', () => {
  resetScene()
  const levelId = firstLevelId()
  expect(levelId).not.toBeNull()

  const legacy = ScanNode.parse({
    id: 'scan_default_venue',
    type: 'scan',
    url: GOSTINKA.url,
    position: [0, 2.7, 0],
    opacity: 100,
    scale: 1,
    metadata: {},
  })
  useScene.getState().createNode(legacy as never, levelId as never)

  const result = syncDefaultVenue(useScene.getState(), GOSTINKA, [])

  expect(result.created).toBe(false)
  const node = useScene.getState().nodes['scan_default_venue' as never]
  expect(node.position).toEqual([0, 0, 0])
  expect(node.parentId).toBe(levelId)
  expect(node.metadata?.tag).toBe(VENUE_TAG)
  expect(Object.keys(scanNodes())).toHaveLength(1)
})

test('drops tagged venue scans pointing at a different model', () => {
  resetScene()
  syncDefaultVenue(useScene.getState(), GOSTINKA, [])
  const levelId = firstLevelId()

  const wrongModel = ScanNode.parse({
    id: 'scan_wrong_model',
    type: 'scan',
    url: '/venues/OTHER.glb',
    position: [0, 0, 0],
    opacity: 100,
    scale: 1,
    metadata: { tag: VENUE_TAG },
  })
  useScene.getState().createNode(wrongModel as never, levelId as never)

  const result = syncDefaultVenue(useScene.getState(), GOSTINKA, [])

  expect(result.created).toBe(false)
  const scans = scanNodes()
  expect(Object.keys(scans)).toHaveLength(1)
  expect(Object.values(scans)[0].url).toBe(GOSTINKA.url)
})

test('does not duplicate the venue when already seeded', () => {
  resetScene()
  syncDefaultVenue(useScene.getState(), GOSTINKA, [])
  const countBefore = Object.keys(scanNodes()).length
  expect(countBefore).toBe(1)

  const result = syncDefaultVenue(useScene.getState(), GOSTINKA, [])

  expect(result.created).toBe(false)
  expect(Object.keys(scanNodes())).toHaveLength(1)
})
