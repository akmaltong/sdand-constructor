import { beforeEach, describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { nodeRegistry, registerNode } from '../../registry';
import { getFloorPlacedElevation, getFloorStackedPosition } from './floor-placed-elevation';
import { spatialGridManager } from './spatial-grid-manager';
const LEVEL_ID = 'level_test';
function makeDefinition(kind, capabilities = {}) {
    return {
        kind,
        schemaVersion: 1,
        schema: z.object({ type: z.literal(kind) }),
        category: 'utility',
        defaults: () => ({}),
        capabilities,
    };
}
function makeLevel() {
    return {
        id: LEVEL_ID,
        type: 'level',
        object: 'node',
        parentId: null,
        visible: true,
        metadata: {},
        children: [],
        level: 0,
    };
}
function makeFloorNode(overrides = {}) {
    return {
        id: 'item_test',
        type: 'item',
        object: 'node',
        parentId: LEVEL_ID,
        visible: true,
        metadata: {},
        children: [],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        asset: {
            id: 'asset_test',
            category: 'test',
            name: 'Test',
            thumbnail: '',
            src: 'asset:test',
            dimensions: [1, 1, 1],
            source: 'library',
        },
        ...overrides,
    };
}
function addSlab(polygon, elevation, id = `slab_${elevation}`) {
    const slab = {
        id,
        type: 'slab',
        object: 'node',
        parentId: LEVEL_ID,
        visible: true,
        metadata: {},
        children: [],
        polygon,
        holes: [],
        holeMetadata: [],
        elevation,
        autoFromWalls: false,
    };
    spatialGridManager.handleNodeCreated(slab, LEVEL_ID);
}
function nodesFor(...nodes) {
    return Object.fromEntries(nodes.map((node) => [node.id, node]));
}
describe('floor-placed elevation resolver', () => {
    beforeEach(() => {
        nodeRegistry._reset();
        spatialGridManager.clear();
    });
    test('returns 0 without a floorPlaced capability', () => {
        registerNode(makeDefinition('item'));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.4);
        const level = makeLevel();
        const node = makeFloorNode();
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        })).toBe(0);
    });
    test('returns 0 when applies returns false', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: () => ({ dimensions: [1, 1, 1], rotation: [0, 0, 0] }),
                applies: () => false,
            },
        }));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.4);
        const level = makeLevel();
        const node = makeFloorNode();
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        })).toBe(0);
    });
    test('clamps non-finite slab elevation to 0', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: () => ({ dimensions: [1, 1, 1], rotation: [0, 0, 0] }),
            },
        }));
        const original = spatialGridManager.getSlabElevationForItem;
        spatialGridManager.getSlabElevationForItem = (() => Number.NaN);
        try {
            const level = makeLevel();
            const node = makeFloorNode();
            expect(getFloorPlacedElevation({
                node,
                nodes: nodesFor(level, node),
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            })).toBe(0);
        }
        finally {
            spatialGridManager.getSlabElevationForItem = original;
        }
    });
    test('returns 0 for a non-level direct parent', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: () => ({ dimensions: [1, 1, 1], rotation: [0, 0, 0] }),
            },
        }));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.4);
        const level = makeLevel();
        const shelf = {
            id: 'shelf_test',
            type: 'shelf',
            parentId: LEVEL_ID,
        };
        const node = makeFloorNode({ parentId: shelf.id });
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, shelf, node),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        })).toBe(0);
    });
    test('returns 0 when the declared parent is missing', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: () => ({ dimensions: [1, 1, 1], rotation: [0, 0, 0] }),
            },
        }));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.4);
        const node = makeFloorNode({ parentId: 'missing_level' });
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(node),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            levelId: LEVEL_ID,
        })).toBe(0);
    });
    test('uses the pending rotated footprint', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: (node) => ({
                    dimensions: [4, 1, 1],
                    rotation: node.rotation,
                }),
            },
        }));
        addSlab([
            [-0.2, 1.2],
            [0.2, 1.2],
            [0.2, 1.8],
            [-0.2, 1.8],
        ], 0.45);
        const level = makeLevel();
        const node = makeFloorNode();
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0, 0],
            rotation: [0, Math.PI / 2, 0],
        })).toBeCloseTo(0.45);
    });
    test('returns slab overlap elevation and stacks Y onto canonical position', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprint: (node) => ({
                    dimensions: [1, 1, 1],
                    rotation: node.rotation,
                }),
            },
        }));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.35);
        const level = makeLevel();
        const node = makeFloorNode();
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0.1, 0],
            rotation: [0, 0, 0],
        })).toBeCloseTo(0.35);
        const stacked = getFloorStackedPosition({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0.1, 0],
            rotation: [0, 0, 0],
        });
        expect(stacked[0]).toBe(0);
        expect(stacked[1]).toBeCloseTo(0.45);
        expect(stacked[2]).toBe(0);
    });
    test('takes the max elevation across composite footprints', () => {
        registerNode(makeDefinition('item', {
            floorPlaced: {
                footprints: () => [
                    { position: [0, 0, 0], dimensions: [1, 1, 1], rotation: [0, 0, 0] },
                    { position: [3, 0, 0], dimensions: [1, 1, 1], rotation: [0, 0, 0] },
                ],
            },
        }));
        addSlab([
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
        ], 0.2, 'slab_low');
        addSlab([
            [2.5, -0.5],
            [3.5, -0.5],
            [3.5, 0.5],
            [2.5, 0.5],
        ], 0.8, 'slab_high');
        const level = makeLevel();
        const node = makeFloorNode();
        expect(getFloorPlacedElevation({
            node,
            nodes: nodesFor(level, node),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        })).toBeCloseTo(0.8);
    });
});
