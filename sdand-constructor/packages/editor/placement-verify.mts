import { sceneRegistry, useScene } from '@pascal-app/core'
import { itemSurfaceStrategy, checkCanPlace } from './src/components/tools/item/placement-strategies.ts'
import { Group, Vector3 } from 'three'

const levelId = 'level-1'
const podiumId = 'podium-1'
const childId = 'equip-1'
const draftId = 'draft-1'

const podiumNode = {
  id: podiumId,
  type: 'item',
  parentId: levelId,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  asset: { src: 'primitive:box:ef4444', dimensions: [2, 0.1, 2], category: 'furniture', surface: { height: 0.1 } },
} as any

const childNode = {
  id: childId,
  type: 'item',
  parentId: podiumId,
  position: [0, 0.1, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  asset: { src: '/equipment/arcade.glb', dimensions: [0.746, 1.542, 0.844], category: 'kitchen' },
} as any

const draftNode = {
  id: draftId,
  type: 'item',
  parentId: podiumId,
  position: [0, 0.1, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  asset: { src: '/equipment/touch_55.glb', dimensions: [0.461, 1.88, 0.763], category: 'kitchen' },
} as any

useScene.setState({
  nodes: {
    [levelId]: { id: levelId, type: 'level', parentId: null },
    [podiumId]: podiumNode,
    [childId]: childNode,
    [draftId]: draftNode,
  },
})

sceneRegistry.nodes.set(podiumId, new Group())

const ctx = {
  asset: draftNode.asset,
  levelId,
  draftItem: draftNode,
  gridPosition: new Vector3(0, 0.1, 0),
  state: { surface: 'item-surface', wallId: null, ceilingId: null, surfaceItemId: podiumId, shelfId: null },
  currentCursorRotationY: 0,
} as any

const event = { node: podiumNode } as any

const validators = {
  canPlaceOnFloor: () => ({ valid: true }),
  canPlaceOnWall: () => ({ valid: true }),
  canPlaceOnCeiling: () => ({ valid: true }),
} as any

// 1) Same spot as existing equipment → blocked
const blocked = itemSurfaceStrategy.click(ctx, event)
console.log('1 click at [0,0.1,0] (overlap):', blocked === null ? 'BLOCKED (ok)' : 'NOT BLOCKED (FAIL)')

// 2) checkCanPlace at same spot → invalid (red cursor)
const overlapInvalid = checkCanPlace(ctx, validators) === false
console.log('2 checkCanPlace overlap:', overlapInvalid ? 'invalid (ok)' : 'VALID (FAIL)')

// 3) Move draft to a free spot → allowed
draftNode.position = [1.5, 0.1, 0]
ctx.gridPosition = new Vector3(1.5, 0.1, 0)
const allowed = itemSurfaceStrategy.click(ctx, event)
console.log('3 click at [1.5,0.1,0] (free):', allowed && allowed.nodeUpdate.parentId === podiumId ? 'ALLOWED (ok)' : 'NOT ALLOWED (FAIL)')
const freeValid = checkCanPlace(ctx, validators) === true
console.log('4 checkCanPlace free:', freeValid ? 'valid (ok)' : 'INVALID (FAIL)')

// 4) Floor placement still works (regression): draft on floor
const floorDraft = {
  ...draftNode,
  id: 'draft-floor',
  parentId: levelId,
  position: [3, 0, 0],
} as any
useScene.setState((s: any) => ({ nodes: { ...s.nodes, ['draft-floor']: floorDraft } }))
const floorCtx = {
  ...ctx,
  draftItem: floorDraft,
  gridPosition: new Vector3(3, 0, 0),
  state: { surface: 'floor', wallId: null, ceilingId: null, surfaceItemId: null, shelfId: null },
} as any
const floorOk = checkCanPlace(floorCtx, validators)
console.log('5 floor placement valid:', floorOk === true ? 'valid (ok)' : 'INVALID (FAIL)')

const blockedOk = blocked === null
const allowedOk = !!allowed && allowed.nodeUpdate.parentId === podiumId
const pass = blockedOk && overlapInvalid && allowedOk && freeValid && floorOk === true
console.log({ blockedOk, overlapInvalid, allowedOk, freeValid, floorOk: floorOk === true })
console.log(pass ? 'PASS' : 'FAIL')
process.exit(pass ? 0 : 1)
