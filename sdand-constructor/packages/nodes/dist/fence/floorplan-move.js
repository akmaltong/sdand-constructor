import { useLiveNodeOverrides, useScene, } from '@pascal-app/core';
import { getSegmentGridStep, isSegmentLongEnough, snapPointToGrid } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
function pointsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}
function getLinkedFenceSnapshots(args) {
    const { fenceId, parentId, originalStart, originalEnd } = args;
    const { nodes } = useScene.getState();
    const snapshots = [];
    for (const node of Object.values(nodes)) {
        if (node?.type !== 'fence' || node.id === fenceId)
            continue;
        if ((node.parentId ?? null) !== parentId)
            continue;
        const fence = node;
        if (pointsEqual(fence.start, originalStart) ||
            pointsEqual(fence.start, originalEnd) ||
            pointsEqual(fence.end, originalStart) ||
            pointsEqual(fence.end, originalEnd)) {
            snapshots.push({
                id: fence.id,
                start: [fence.start[0], fence.start[1]],
                end: [fence.end[0], fence.end[1]],
            });
        }
    }
    return snapshots;
}
/**
 * 2D floor-plan body move for fence. Mirrors `wallFloorplanMoveTarget`
 * but without bridge-wall planning: fence corners cascade through
 * shared endpoints, ALT detaches them, and there's no perpendicular
 * branch logic to chase. Tick publishes endpoint overrides; commit
 * folds them into a single tracked update.
 */
export const fenceFloorplanMoveTarget = ({ node }) => {
    const fenceId = node.id;
    const originalStart = [node.start[0], node.start[1]];
    const originalEnd = [node.end[0], node.end[1]];
    const originalMetadata = typeof node.metadata === 'object' && node.metadata !== null && !Array.isArray(node.metadata)
        ? node.metadata
        : {};
    const isNew = !!originalMetadata.isNew;
    const linkedOriginals = isNew
        ? []
        : getLinkedFenceSnapshots({
            fenceId,
            parentId: node.parentId ?? null,
            originalStart,
            originalEnd,
        });
    let rawAnchor = null;
    let lastDelta = [0, 0];
    let lastNextStart = originalStart;
    let lastNextEnd = originalEnd;
    const projectLinked = (snapshot, nextStart, nextEnd) => ({
        start: pointsEqual(snapshot.start, originalStart)
            ? nextStart
            : pointsEqual(snapshot.start, originalEnd)
                ? nextEnd
                : snapshot.start,
        end: pointsEqual(snapshot.end, originalStart)
            ? nextStart
            : pointsEqual(snapshot.end, originalEnd)
                ? nextEnd
                : snapshot.end,
    });
    const session = {
        affectedIds: [fenceId, ...linkedOriginals.map((l) => l.id)],
        apply({ planPoint, modifiers }) {
            if (!rawAnchor) {
                rawAnchor = [planPoint[0], planPoint[1]];
                return;
            }
            const rawDx = planPoint[0] - rawAnchor[0];
            const rawDz = planPoint[1] - rawAnchor[1];
            const step = getSegmentGridStep();
            const nextStart = modifiers.shiftKey
                ? [originalStart[0] + rawDx, originalStart[1] + rawDz]
                : snapPointToGrid([originalStart[0] + rawDx, originalStart[1] + rawDz], step);
            const dx = nextStart[0] - originalStart[0];
            const dz = nextStart[1] - originalStart[1];
            if (dx === lastDelta[0] && dz === lastDelta[1])
                return;
            lastDelta = [dx, dz];
            const nextEnd = [originalEnd[0] + dx, originalEnd[1] + dz];
            lastNextStart = nextStart;
            lastNextEnd = nextEnd;
            const linkedUpdates = modifiers.altKey
                ? []
                : linkedOriginals.map((l) => ({ id: l.id, ...projectLinked(l, nextStart, nextEnd) }));
            useLiveNodeOverrides
                .getState()
                .setMany([
                [fenceId, { start: nextStart, end: nextEnd }],
                ...linkedUpdates.map((u) => [u.id, { start: u.start, end: u.end }]),
            ]);
            const sceneState = useScene.getState();
            sceneState.markDirty(fenceId);
            for (const u of linkedUpdates)
                sceneState.markDirty(u.id);
        },
        canCommit() {
            const [dx, dz] = lastDelta;
            return (dx !== 0 || dz !== 0) && isSegmentLongEnough(lastNextStart, lastNextEnd);
        },
        commit() {
            // The overlay (see `floorplan-registry-move-overlay.tsx`) has already
            // (a) written the snapshot back to scene to establish a clean
            // baseline for the single-undo dance and (b) resumed history.
            // This `updateNodes` IS the final-state write — recorded as one
            // tracked change. Drop the override AFTER the scene write so
            // mid-commit reads still see the new position (override wins until
            // cleared; scene wins after).
            const fenceUpdate = isNew
                ? {
                    id: fenceId,
                    data: {
                        start: lastNextStart,
                        end: lastNextEnd,
                        metadata: { ...originalMetadata, isNew: false },
                    },
                }
                : { id: fenceId, data: { start: lastNextStart, end: lastNextEnd } };
            const linkedUpdates = linkedOriginals.map((l) => ({
                id: l.id,
                ...projectLinked(l, lastNextStart, lastNextEnd),
            }));
            useScene
                .getState()
                .updateNodes([
                fenceUpdate,
                ...linkedUpdates.map((u) => ({ id: u.id, data: { start: u.start, end: u.end } })),
            ]);
            const overrides = useLiveNodeOverrides.getState();
            overrides.clear(fenceId);
            for (const l of linkedOriginals)
                overrides.clear(l.id);
            // Re-select the moved fence so selection-gated chrome (endpoint
            // handles, side arrows, curve dot) remains visible at the new
            // position — the action menu's Move click cleared selection on
            // entry. Matches the wall move-target's post-commit re-select.
            useViewer.getState().setSelection({ selectedIds: [fenceId] });
        },
    };
    return session;
};
