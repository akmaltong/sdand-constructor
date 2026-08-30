import { beforeEach, describe, expect, test } from 'bun:test';
import useScene from '../use-scene';
globalThis.requestAnimationFrame ??= ((cb) => {
    cb(0);
    return 0;
});
globalThis.cancelAnimationFrame ??=
    () => { };
const SHELF_ID = 'shelf_sanitize';
const SOLAR_PANEL_ID = 'sp_x';
function makeShelf(overrides = {}) {
    return {
        id: SHELF_ID,
        type: 'shelf',
        parentId: null,
        object: 'node',
        visible: true,
        name: 'Shelf',
        metadata: {},
        children: [],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        width: 1.2,
        depth: 0.3,
        thickness: 0.04,
        height: 0.9,
        style: 'wall-shelf',
        rows: 1,
        columns: 1,
        withBack: false,
        withSides: true,
        withBottom: false,
        bracketStyle: 'minimal',
        ...overrides,
    };
}
function makeSolarPanel() {
    return {
        id: SOLAR_PANEL_ID,
        type: 'solar-panel',
        parentId: null,
        object: 'node',
        visible: true,
        name: 'Panel',
        metadata: {},
        position: [0, 0, 0],
        rotation: 0,
        rows: 2,
        columns: 3,
        panelWidth: 1,
        panelHeight: 1.65,
        gapX: 0.02,
        gapY: 0.02,
        mountingType: 'flush',
        tiltAngle: 15,
        standoffHeight: 0.05,
        frameThickness: 0.04,
        frameDepth: 0.04,
    };
}
function shelf() {
    return useScene.getState().nodes[SHELF_ID];
}
describe('node mutation numeric sanitization', () => {
    beforeEach(() => {
        useScene.setState({
            nodes: {
                [SHELF_ID]: makeShelf(),
                [SOLAR_PANEL_ID]: makeSolarPanel(),
            },
            rootNodeIds: [SHELF_ID, SOLAR_PANEL_ID],
            dirtyNodes: new Set(),
            collections: {},
            readOnly: false,
        });
        useScene.temporal.getState().clear();
    });
    test('drops NaN numeric updates while preserving other fields in the patch', () => {
        useScene.getState().updateNode(SHELF_ID, {
            thickness: Number.NaN,
            name: 'Renamed after NaN',
        });
        expect(shelf().thickness).toBe(0.04);
        expect(Number.isFinite(shelf().thickness)).toBe(true);
        expect(shelf().name).toBe('Renamed after NaN');
    });
    test('drops Infinity numeric updates while preserving later normal updates', () => {
        useScene.getState().updateNode(SHELF_ID, {
            width: Infinity,
            name: 'Renamed after Infinity',
        });
        expect(shelf().width).toBe(1.2);
        expect(Number.isFinite(shelf().width)).toBe(true);
        expect(shelf().name).toBe('Renamed after Infinity');
        useScene.getState().updateNode(SHELF_ID, {
            name: 'Clean rename',
        });
        expect(shelf().name).toBe('Clean rename');
    });
    test('clamps out-of-range numeric updates to the node schema bounds', () => {
        useScene.getState().updateNode(SHELF_ID, {
            width: 99,
            thickness: -1,
        });
        expect(shelf().width).toBe(3);
        expect(shelf().thickness).toBe(0.01);
    });
    test('preserves extra fields while sanitizing numeric updates', () => {
        useScene.setState({
            nodes: {
                [SHELF_ID]: {
                    ...makeShelf(),
                    legacyField: 'current',
                },
            },
            rootNodeIds: [SHELF_ID],
        });
        useScene.getState().updateNode(SHELF_ID, {
            width: Infinity,
            legacyPatch: 'patch',
        });
        const node = useScene.getState().nodes[SHELF_ID];
        expect(node.width).toBe(1.2);
        expect(node.legacyField).toBe('current');
        expect(node.legacyPatch).toBe('patch');
    });
    test('allows non-canonical ids to receive updates', () => {
        useScene.getState().updateNode(SOLAR_PANEL_ID, {
            name: 'Updated panel',
        });
        const panel = useScene.getState().nodes[SOLAR_PANEL_ID];
        expect(panel.name).toBe('Updated panel');
    });
    test('sanitizes non-finite numeric values during create', () => {
        const createdId = 'shelf_created';
        useScene.getState().createNode(makeShelf({
            id: createdId,
            width: Infinity,
            thickness: Number.NaN,
        }));
        const created = useScene.getState().nodes[createdId];
        expect(created.width).toBe(1.2);
        expect(created.thickness).toBe(0.04);
        expect(Number.isFinite(created.width)).toBe(true);
        expect(Number.isFinite(created.thickness)).toBe(true);
    });
});
