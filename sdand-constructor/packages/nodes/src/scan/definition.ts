import {
  type FloorplanGeometry,
  type NodeDefinition,
  ScanNode as ScanNodeSchema,
} from '@pascal-app/core'
import { scanParametrics } from './parametrics'
import { ScanNode } from './schema'

// Sdand: 2D-контур площадки. Метадата ноды содержит { x, z, width, depth }
// в мировых координатах модели (mesh bbox без применения position). Ноды
// без footprint возвращают null и в 2D просто не рисуются.
function buildScanFloorplan(node: ScanNode): FloorplanGeometry | null {
  const fp = (node.metadata as { footprint?: { x: number; z: number; width: number; depth: number } } | undefined)?.footprint
  if (!fp) return null
  const s = node.scale ?? 1
  return {
    kind: 'rect',
    x: node.position[0] + fp.x * s,
    y: node.position[2] + fp.z * s,
    width: fp.width * s,
    height: fp.depth * s,
    // Без fill — метровая сетка проступает сквозь пол здания.
    fill: 'none',
    stroke: '#9ca3af',
    strokeWidth: 1.2,
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  }
}

/**
 * Scan — Stage A. Mesh imported from the capture pipeline (LiDAR /
 * photogrammetry). `ScanSystem` handles mesh loading + per-frame
 * positioning; renderer mounts the imported geometry.
 */
export const scanDefinition: NodeDefinition<typeof ScanNode> = {
  kind: 'scan',
  schemaVersion: 1,
  schema: ScanNode,
  category: 'site',

  defaults: () => {
    const stub = ScanNodeSchema.parse({ id: 'scan_default' as never, type: 'scan' })
    const { id: _id, type: _type, ...rest } = stub
    return rest
  },

  capabilities: {
    selectable: { hitVolume: 'bbox' },
    duplicable: false,
    deletable: true,
    // Scans carry user-uploaded imagery — cataloging them as
    // reusable presets is out of scope.
    presettable: false,
  },

  parametrics: scanParametrics,

  renderer: {
    kind: 'parametric',
    module: () => import('./renderer'),
  },
  system: {
    module: () => import('./system'),
    priority: 1,
  },

  floorplan: buildScanFloorplan,

  presentation: {
    label: 'Scan',
    description: 'A captured mesh (LiDAR / photogrammetry) imported as a scene reference.',
    icon: { kind: 'url', src: '/icons/mesh.png' },
    paletteSection: 'site',
    paletteOrder: 40,
  },

  mcp: {
    description: 'A captured mesh import.',
  },
}
