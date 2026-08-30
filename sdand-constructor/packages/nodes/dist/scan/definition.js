import { ScanNode as ScanNodeSchema, } from '@pascal-app/core';
import { scanParametrics } from './parametrics';
import { ScanNode } from './schema';
const HANDLE_HEIGHT = 0.3;
const HANDLE_OFFSET = 2;
function scanMoveHandle() {
    return {
        kind: 'translate',
        placement: {
            position: () => [0, HANDLE_HEIGHT, HANDLE_OFFSET],
        },
        apply: (_n, pos) => ({ position: [pos[0], _n.position[1], pos[2]] }),
    };
}
function scanRotateHandle() {
    return {
        kind: 'arc-resize',
        axis: 'angular',
        shape: 'rotate',
        apply: (initial, delta) => ({
            rotation: [0, (initial.rotation?.[1] ?? 0) - delta, 0],
        }),
        placement: {
            position: () => [HANDLE_OFFSET, HANDLE_HEIGHT, HANDLE_OFFSET],
            rotationY: () => -Math.PI / 4,
        },
        decoration: {
            kind: 'ring',
            radius: () => HANDLE_OFFSET * 1.2,
            y: () => HANDLE_HEIGHT,
        },
    };
}
// Sdand: 2D-контур площадки. Метадата ноды содержит { x, z, width, depth }
// в мировых координатах модели (mesh bbox без применения position). Ноды
// без footprint возвращают null и в 2D просто не рисуются.
function buildScanFloorplan(node) {
    const fp = node.metadata?.footprint;
    if (!fp)
        return null;
    const s = node.scale ?? 1;
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
    };
}
/**
 * Scan — Stage A. Mesh imported from the capture pipeline (LiDAR /
 * photogrammetry). `ScanSystem` handles mesh loading + per-frame
 * positioning; renderer mounts the imported geometry.
 */
export const scanDefinition = {
    kind: 'scan',
    schemaVersion: 1,
    schema: ScanNode,
    category: 'site',
    defaults: () => {
        const stub = ScanNodeSchema.parse({ id: 'scan_default', type: 'scan' });
        const { id: _id, type: _type, ...rest } = stub;
        return rest;
    },
    capabilities: {
        selectable: { hitVolume: 'bbox' },
        duplicable: false,
        deletable: true,
        presettable: false,
    },
    handles: [scanMoveHandle(), scanRotateHandle()],
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
};
