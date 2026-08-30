import { emitter, movingFootprintAnchors, resolveAlignment, sceneRegistry, snapPointToGrid, } from '@pascal-app/core';
import { Vector3 } from 'three';
export const FLOOR_PLACEMENT_ALIGNMENT_THRESHOLD_M = 0.08;
export const FLOOR_PLACEMENT_CLICK_TRIGGER_KINDS = [
    'shelf',
    'item',
    'slab',
    'ceiling',
    'wall',
    'fence',
    'column',
    'roof',
    'roof-segment',
    'stair',
    'stair-segment',
];
const worldVector = new Vector3();
export function getLevelLocalSnappedPosition(levelId, event, gridStep) {
    const levelObject = sceneRegistry.nodes.get(levelId);
    if (!levelObject) {
        const rawPoint = 'node' in event ? event.position : event.localPosition;
        const [sx, sz] = snapPointToGrid([rawPoint[0], rawPoint[2]], gridStep);
        return [sx, 0, sz];
    }
    worldVector.set(event.position[0], event.position[1], event.position[2]);
    levelObject.updateWorldMatrix(true, false);
    levelObject.worldToLocal(worldVector);
    const [sx, sz] = snapPointToGrid([worldVector.x, worldVector.z], gridStep);
    return [sx, 0, sz];
}
export function resolveAlignedFloorPlacement({ node, rawX, rawZ, gridStep, candidates, bypassAlignment = false, rotationY = 0, }) {
    const [sx, sz] = snapPointToGrid([rawX, rawZ], gridStep);
    let ax = sx;
    let az = sz;
    const result = !bypassAlignment && candidates.length > 0
        ? resolveAlignment({
            moving: movingFootprintAnchors(node, sx, sz, rotationY),
            candidates,
            threshold: FLOOR_PLACEMENT_ALIGNMENT_THRESHOLD_M,
        })
        : null;
    if (result?.snap) {
        ax += result.snap.dx;
        az += result.snap.dz;
    }
    return {
        position: [ax, 0, az],
        guides: result?.guides ?? [],
    };
}
export function stopPlacementCommitPropagation(event) {
    const native = event.nativeEvent;
    const nativeStopPropagation = native
        ?.stopPropagation;
    if (typeof nativeStopPropagation === 'function') {
        nativeStopPropagation.call(native);
    }
    const direct = event.stopPropagation;
    if (typeof direct === 'function')
        direct.call(event);
}
export function subscribeFloorPlacementClicks(onClick) {
    emitter.on('grid:click', onClick);
    for (const kind of FLOOR_PLACEMENT_CLICK_TRIGGER_KINDS) {
        const key = `${kind}:click`;
        emitter.on(key, onClick);
    }
    return () => {
        emitter.off('grid:click', onClick);
        for (const kind of FLOOR_PLACEMENT_CLICK_TRIGGER_KINDS) {
            const key = `${kind}:click`;
            emitter.off(key, onClick);
        }
    };
}
