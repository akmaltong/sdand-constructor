import { useScene, } from '@pascal-app/core';
import { snapPointToGrid } from '@pascal-app/editor';
function getRing(node, holeIndex) {
    if (holeIndex === undefined) {
        return node.polygon.map(([x, y]) => [x, y]);
    }
    const hole = node.holes?.[holeIndex];
    if (!hole)
        return null;
    return hole.map(([x, y]) => [x, y]);
}
/**
 * Returns a patch object that, when applied to the node, updates the
 * targeted ring (boundary polygon or specific hole) to `nextRing`. The
 * cast through `unknown → Partial<unknown> → never` satisfies the
 * generic `updateNodes` patch type without forcing every variant of
 * the kind union into scope here.
 */
function buildRingPatch(node, holeIndex, nextRing) {
    if (holeIndex === undefined) {
        return { polygon: nextRing };
    }
    const nextHoles = (node.holes ?? []).map((hole, i) => i === holeIndex ? nextRing : hole.map(([x, y]) => [x, y]));
    return { holes: nextHoles };
}
export function createPolygonVertexAffordance(kind) {
    return {
        start({ node, payload }) {
            const { vertexIndex, holeIndex } = payload;
            const originalRing = getRing(node, holeIndex);
            if (!originalRing) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            return {
                affectedIds: [node.id],
                apply({ planPoint, modifiers }) {
                    const snapped = modifiers.shiftKey
                        ? planPoint
                        : snapPointToGrid(planPoint);
                    const nextRing = originalRing.map((p, i) => i === vertexIndex ? [snapped[0], snapped[1]] : p);
                    const patch = buildRingPatch(node, holeIndex, nextRing);
                    useScene
                        .getState()
                        .updateNodes([{ id: node.id, data: patch }]);
                },
                canCommit() {
                    const final = useScene.getState().nodes[node.id];
                    if (!final || final.type !== kind)
                        return false;
                    const finalRing = holeIndex === undefined ? final.polygon : (final.holes ?? [])[holeIndex];
                    return !!finalRing && finalRing.length >= 3;
                },
            };
        },
    };
}
/**
 * Companion to `createPolygonVertexAffordance`. Inserts a new vertex at
 * the midpoint of edge `edgeIndex` (between vertices i and i+1) and
 * then drags that new vertex with the pointer. The dispatcher's
 * snapshot was taken **before** `start()` ran, so a pointer-up without
 * movement reverts to the pre-insert ring — "click without drag" is a
 * no-op, matching the legacy slab boundary editor.
 */
export function createPolygonAddVertexAffordance(kind) {
    return {
        start({ node, payload }) {
            const { edgeIndex, holeIndex } = payload;
            const originalRing = getRing(node, holeIndex);
            if (!originalRing) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            const a = originalRing[edgeIndex];
            const b = originalRing[(edgeIndex + 1) % originalRing.length];
            if (!a || !b) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            const newVertexIndex = edgeIndex + 1;
            const initialRing = [
                ...originalRing.slice(0, newVertexIndex),
                midpoint,
                ...originalRing.slice(newVertexIndex),
            ];
            // Apply the insert immediately so the user sees the new vertex
            // before they even move.
            const initialPatch = buildRingPatch(node, holeIndex, initialRing);
            useScene
                .getState()
                .updateNodes([{ id: node.id, data: initialPatch }]);
            return {
                affectedIds: [node.id],
                apply({ planPoint, modifiers }) {
                    const snapped = modifiers.shiftKey
                        ? planPoint
                        : snapPointToGrid(planPoint);
                    const nextRing = initialRing.map((p, i) => i === newVertexIndex ? [snapped[0], snapped[1]] : p);
                    const patch = buildRingPatch(node, holeIndex, nextRing);
                    useScene
                        .getState()
                        .updateNodes([{ id: node.id, data: patch }]);
                },
                canCommit() {
                    const final = useScene.getState().nodes[node.id];
                    if (!final || final.type !== kind)
                        return false;
                    const finalRing = holeIndex === undefined ? final.polygon : (final.holes ?? [])[holeIndex];
                    return !!finalRing && finalRing.length >= 3;
                },
            };
        },
    };
}
/**
 * Edge-drag: move a whole edge perpendicular to itself. Both endpoints
 * translate by `edgeNormal * projectedDelta`. The other vertices of
 * the ring stay put — adjacent edges effectively pivot around their
 * far endpoints.
 *
 * Snap is grid-aligned on the projected scalar (so a Shift-free drag
 * lands on grid lines along the edge normal).
 */
export function createPolygonMoveEdgeAffordance(kind) {
    return {
        start({ node, payload, initialPlanPoint }) {
            const { edgeIndex, holeIndex } = payload;
            const originalRing = getRing(node, holeIndex);
            if (!originalRing) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            const startVertex = originalRing[edgeIndex];
            const endVertex = originalRing[(edgeIndex + 1) % originalRing.length];
            if (!startVertex || !endVertex) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            const dx = endVertex[0] - startVertex[0];
            const dy = endVertex[1] - startVertex[1];
            const len = Math.hypot(dx, dy);
            if (len < 1e-6) {
                return {
                    affectedIds: [node.id],
                    apply() { },
                    canCommit() {
                        return false;
                    },
                };
            }
            // Perpendicular unit normal (rotate 90° CCW).
            const normalX = -dy / len;
            const normalY = dx / len;
            const startX = initialPlanPoint[0];
            const startY = initialPlanPoint[1];
            const edgeStartIndex = edgeIndex;
            const edgeEndIndex = (edgeIndex + 1) % originalRing.length;
            return {
                affectedIds: [node.id],
                apply({ planPoint, modifiers }) {
                    // Project the pointer delta onto the edge normal — that's the
                    // signed perpendicular distance the edge should travel.
                    const deltaX = planPoint[0] - startX;
                    const deltaY = planPoint[1] - startY;
                    let projection = deltaX * normalX + deltaY * normalY;
                    if (!modifiers.shiftKey) {
                        // Snap the projection scalar to a 0.5m grid (legacy uses the
                        // same half-meter snap for slab edges).
                        projection = Math.round(projection * 2) / 2;
                    }
                    const nextRing = originalRing.map((p, i) => {
                        if (i === edgeStartIndex || i === edgeEndIndex) {
                            return [p[0] + normalX * projection, p[1] + normalY * projection];
                        }
                        return [p[0], p[1]];
                    });
                    const patch = buildRingPatch(node, holeIndex, nextRing);
                    useScene
                        .getState()
                        .updateNodes([{ id: node.id, data: patch }]);
                },
                canCommit() {
                    const final = useScene.getState().nodes[node.id];
                    if (!final || final.type !== kind)
                        return false;
                    const finalRing = holeIndex === undefined ? final.polygon : (final.holes ?? [])[holeIndex];
                    return !!finalRing && finalRing.length >= 3;
                },
            };
        },
    };
}
