import { getMaxWallCurveOffset, getWallChordFrame, normalizeWallCurveOffset, useLiveNodeOverrides, useScene, } from '@pascal-app/core';
import { alignFloorplanDraftPoint, getSegmentGridStep, isSegmentLongEnough, snapBuildingLocalToWorldGrid, snapScalarToGrid, snapWallDraftPoint, useAlignmentGuides, WALL_FINE_GRID_STEP, WALL_GRID_STEP, } from '@pascal-app/editor';
function pointsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}
function collectLevelWalls(nodes, excludeWallId) {
    const out = [];
    for (const node of Object.values(nodes)) {
        if (node?.type === 'wall' && node.id !== excludeWallId)
            out.push(node);
    }
    return out;
}
function collectLinkedWalls(nodes, draggedWallId, originalStart, originalEnd) {
    const linked = [];
    for (const node of Object.values(nodes)) {
        if (node?.type !== 'wall')
            continue;
        if (node.id === draggedWallId)
            continue;
        const wall = node;
        if (pointsEqual(wall.start, originalStart) ||
            pointsEqual(wall.start, originalEnd) ||
            pointsEqual(wall.end, originalStart) ||
            pointsEqual(wall.end, originalEnd)) {
            linked.push({
                id: wall.id,
                start: [...wall.start],
                end: [...wall.end],
            });
        }
    }
    return linked;
}
/**
 * Wall curve sagitta drag — 1:1 port of the legacy
 * `handleWallCurvePointerDown` + commit flow. Drag projects the pointer
 * onto the chord normal to compute a `curveOffset`, snapped to the
 * grid step (Shift bypasses snap), clamped to `getMaxWallCurveOffset`,
 * normalized via `normalizeWallCurveOffset`. Same single-undo dance as
 * the move-endpoint affordance — the dispatcher handles snapshot /
 * pause / resume around `apply`.
 */
export const wallCurveAffordance = {
    start({ node }) {
        // Chord frame is fixed for the duration of the drag — only the
        // pointer projection along its normal changes.
        const chord = getWallChordFrame(node);
        const maxOffset = getMaxWallCurveOffset(node);
        const wallId = node.id;
        let lastCurveOffset = node.curveOffset ?? 0;
        return {
            affectedIds: [node.id],
            apply({ planPoint, modifiers }) {
                const snapStep = getSegmentGridStep();
                // World-grid snap so a rotated building doesn't drag the curve
                // handle off the visible grid.
                const [x, y] = modifiers.shiftKey
                    ? [planPoint[0], planPoint[1]]
                    : snapBuildingLocalToWorldGrid([planPoint[0], planPoint[1]], snapStep);
                // Signed projection of (snappedPoint - chord midpoint) onto the
                // chord normal. Legacy negates because the SVG y-axis flips
                // relative to plan y; the registry layer doesn't apply that flip
                // so the projection runs against the same normal the 3D tool
                // uses (which also has no flip). The result matches the 3D port
                // in `nodes/src/wall/curve-tool.tsx`.
                const offsetFromMidpoint = -((x - chord.midpoint.x) * chord.normal.x +
                    (y - chord.midpoint.y) * chord.normal.y);
                const snappedOffset = modifiers.shiftKey
                    ? offsetFromMidpoint
                    : snapScalarToGrid(offsetFromMidpoint, snapStep);
                const nextCurveOffset = normalizeWallCurveOffset(node, Math.max(-maxOffset, Math.min(maxOffset, snappedOffset)));
                lastCurveOffset = nextCurveOffset;
                // Publish the curve preview as a live override so renderers see
                // it without zustand churn. Mark the wall dirty so `WallSystem`
                // rebuilds the geometry next frame using the override-merged
                // node.
                useLiveNodeOverrides.getState().set(wallId, { curveOffset: nextCurveOffset });
                useScene.getState().markDirty(wallId);
            },
            canCommit() {
                // Curve drag is always commit-eligible — the offset is already
                // clamped + normalized so we never end up in an invalid state.
                return true;
            },
            commit() {
                // Atomic, tracked write of the final curve offset, then drop
                // the override so the scene state is the single source of
                // truth again.
                useScene.getState().updateNodes([{ id: wallId, data: { curveOffset: lastCurveOffset } }]);
                useLiveNodeOverrides.getState().clear(wallId);
            },
        };
    },
};
export const wallMoveEndpointAffordance = {
    start({ node, payload, nodes }) {
        const { endpoint } = payload;
        const fixedPoint = endpoint === 'start' ? [...node.end] : [...node.start];
        const originalStart = [...node.start];
        const originalEnd = [...node.end];
        const linkedWalls = collectLinkedWalls(nodes, node.id, originalStart, originalEnd);
        const affectedIds = [node.id, ...linkedWalls.map((w) => w.id)];
        // Remember the latest preview so `commit()` can write it tracked.
        let lastPrimaryStart = originalStart;
        let lastPrimaryEnd = originalEnd;
        let lastLinkedUpdates = [];
        return {
            affectedIds,
            apply({ planPoint, modifiers }) {
                // Re-collect walls every tick so the snap pipeline sees fresh
                // positions (matters when the user releases + re-grabs without
                // unmounting the layer). Snap reads from scene — which holds
                // the pre-drag positions throughout — so the linked-wall snap
                // targets stay anchored to where corners *were*, exactly like
                // the legacy flow.
                const sceneNodes = useScene.getState().nodes;
                const walls = collectLevelWalls(sceneNodes, node.id);
                // Endpoint move = grid snap, never 45° from the fixed corner —
                // the angle snap is for initial draft only. Shift switches to
                // the fine grid step for precision, matching the 3D
                // `MoveWallEndpointTool`.
                const worldStep = modifiers.shiftKey ? WALL_FINE_GRID_STEP : WALL_GRID_STEP;
                const snapped = snapWallDraftPoint({
                    point: planPoint,
                    walls,
                    ignoreWallIds: [node.id],
                    step: modifiers.shiftKey ? WALL_FINE_GRID_STEP : undefined,
                    gridSnap: (p) => snapBuildingLocalToWorldGrid(p, worldStep),
                });
                // Figma-style alignment on the dragged corner — snaps it onto another
                // object's edge / wall face and publishes a guide. The dragged wall
                // and its linked siblings (which cascade with the corner) are excluded
                // from the candidate pool. Alt is reserved for detach, NOT bypass.
                const aligned = alignFloorplanDraftPoint(snapped, {
                    excludeIds: [node.id, ...linkedWalls.map((w) => w.id)],
                });
                const primaryStart = endpoint === 'start' ? aligned : fixedPoint;
                const primaryEnd = endpoint === 'end' ? aligned : fixedPoint;
                // ALT detaches: the linked walls keep their original endpoints,
                // and only the dragged wall moves.
                const linkedUpdates = modifiers.altKey
                    ? []
                    : linkedWalls.map((w) => ({
                        id: w.id,
                        start: pointsEqual(w.start, originalStart)
                            ? primaryStart
                            : pointsEqual(w.start, originalEnd)
                                ? primaryEnd
                                : w.start,
                        end: pointsEqual(w.end, originalStart)
                            ? primaryStart
                            : pointsEqual(w.end, originalEnd)
                                ? primaryEnd
                                : w.end,
                    }));
                lastPrimaryStart = primaryStart;
                lastPrimaryEnd = primaryEnd;
                lastLinkedUpdates = linkedUpdates;
                // Publish overrides instead of writing to scene. WallSystem +
                // 2D layer + sidebar panel merge these in. Marking dirty
                // wakes the system's `useFrame` rebuild pass.
                const overrides = useLiveNodeOverrides.getState();
                const sceneState = useScene.getState();
                overrides.set(node.id, { start: primaryStart, end: primaryEnd });
                sceneState.markDirty(node.id);
                for (const upd of linkedUpdates) {
                    overrides.set(upd.id, { start: upd.start, end: upd.end });
                    sceneState.markDirty(upd.id);
                }
            },
            canCommit() {
                // Pointer-up always runs canCommit — drop the alignment guide here
                // so it doesn't linger after a commit / reject.
                useAlignmentGuides.getState().clear();
                // The dragged wall must still be long enough at the preview
                // length — checked against `lastPrimary*`, not scene, because
                // scene holds baseline values until commit().
                return isSegmentLongEnough(lastPrimaryStart, lastPrimaryEnd);
            },
            commit() {
                // Atomic tracked write of the final endpoints, then drop the
                // overrides so the scene state is the single source of truth
                // again.
                useScene.getState().updateNodes([
                    { id: node.id, data: { start: lastPrimaryStart, end: lastPrimaryEnd } },
                    ...lastLinkedUpdates.map((u) => ({
                        id: u.id,
                        data: { start: u.start, end: u.end },
                    })),
                ]);
                const overrides = useLiveNodeOverrides.getState();
                overrides.clear(node.id);
                for (const upd of lastLinkedUpdates)
                    overrides.clear(upd.id);
            },
        };
    },
};
