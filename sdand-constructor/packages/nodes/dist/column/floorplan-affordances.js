import { useScene, } from '@pascal-app/core';
// Floor minimums — mirror the 3D handles in `column/definition.ts` so a
// drag can't push a value past what the renderer accepts.
const MIN_COLUMN_WIDTH = 0.1;
const MIN_COLUMN_DEPTH = 0.1;
const MIN_COLUMN_RADIUS = 0.05;
const MIN_BRACE_DIMENSION = 0.04;
const MIN_BRACE_BOTTOM_SPREAD = 0.2;
const MIN_BRACE_TOP_SPREAD = 0;
export const columnResizeAffordance = {
    start({ node, payload, initialPlanPoint }) {
        const { dim, planAxis } = payload;
        const columnId = node.id;
        const [ax, ay] = planAxis;
        const initialProj = initialPlanPoint[0] * ax + initialPlanPoint[1] * ay;
        const initialWidth = node.width;
        const initialDepth = node.depth;
        const initialRadius = node.radius;
        const initialBraceWidth = node.braceWidth ?? node.width;
        const initialBraceDepth = node.braceDepth ?? node.depth;
        const initialBraceBottomSpread = node.braceBottomSpread ?? Math.max(node.width * 3, 1.2);
        const initialBraceTopSpread = node.braceTopSpread ?? 0.12;
        let lastPatch = {};
        const commitPatch = (patch) => {
            lastPatch = patch;
            useScene.getState().updateNode(columnId, patch);
        };
        return {
            affectedIds: [columnId],
            apply({ planPoint }) {
                const currentProj = planPoint[0] * ax + planPoint[1] * ay;
                const projDelta = currentProj - initialProj;
                switch (dim) {
                    case 'width':
                        commitPatch({
                            width: Math.max(MIN_COLUMN_WIDTH, initialWidth + 2 * projDelta),
                        });
                        return;
                    case 'depth':
                        commitPatch({
                            depth: Math.max(MIN_COLUMN_DEPTH, initialDepth + 2 * projDelta),
                        });
                        return;
                    case 'uniform': {
                        const next = Math.max(MIN_COLUMN_WIDTH, initialWidth + 2 * projDelta);
                        commitPatch({ width: next, depth: next });
                        return;
                    }
                    case 'radius':
                        commitPatch({
                            radius: Math.max(MIN_COLUMN_RADIUS, initialRadius + projDelta),
                        });
                        return;
                    case 'brace-width':
                        commitPatch({
                            braceWidth: Math.max(MIN_BRACE_DIMENSION, initialBraceWidth + 2 * projDelta),
                        });
                        return;
                    case 'brace-depth':
                        commitPatch({
                            braceDepth: Math.max(MIN_BRACE_DIMENSION, initialBraceDepth + 2 * projDelta),
                        });
                        return;
                    case 'brace-bottom-spread':
                        commitPatch({
                            braceBottomSpread: Math.max(MIN_BRACE_BOTTOM_SPREAD, initialBraceBottomSpread + 2 * projDelta),
                        });
                        return;
                    case 'brace-top-spread':
                        commitPatch({
                            braceTopSpread: Math.max(MIN_BRACE_TOP_SPREAD, initialBraceTopSpread + 2 * projDelta),
                        });
                        return;
                }
            },
            canCommit() {
                return true;
            },
            commit() {
                if (Object.keys(lastPatch).length > 0) {
                    useScene.getState().updateNode(columnId, lastPatch);
                }
            },
        };
    },
};
/**
 * Column rotation drag (floor-plan). Sister to the 3D
 * `columnRotateHandle` (arc-resize). Same `- delta` convention as the
 * 3D handle: the floor-plan builder plots the footprint at
 * `-column.rotation` (see `buildColumnFloorplan`'s `rot = -node.rotation`),
 * so the 2D view rotates the same direction as 3D for the same
 * `rotation` value, and the same cursor gesture writes the same sign
 * in both views.
 */
export const columnRotateAffordance = {
    start({ node, initialPlanPoint }) {
        const columnId = node.id;
        const initialRotation = node.rotation ?? 0;
        const cx = node.position[0];
        const cz = node.position[2];
        const initialAngle = Math.atan2(initialPlanPoint[1] - cz, initialPlanPoint[0] - cx);
        let lastRotation = initialRotation;
        return {
            affectedIds: [columnId],
            apply({ planPoint }) {
                const currentAngle = Math.atan2(planPoint[1] - cz, planPoint[0] - cx);
                let delta = currentAngle - initialAngle;
                while (delta > Math.PI)
                    delta -= 2 * Math.PI;
                while (delta < -Math.PI)
                    delta += 2 * Math.PI;
                const newRotation = initialRotation - delta;
                lastRotation = newRotation;
                useScene.getState().updateNode(columnId, { rotation: newRotation });
            },
            canCommit() {
                return true;
            },
            commit() {
                useScene.getState().updateNode(columnId, { rotation: lastRotation });
            },
        };
    },
};
