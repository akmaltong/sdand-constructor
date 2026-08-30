import { type FenceNode, type FloorplanAffordance } from '@pascal-app/core';
/**
 * Fence curve sagitta drag — 1:1 mirror of `wallCurveAffordance`. Drag
 * projects the pointer onto the chord normal to compute `curveOffset`,
 * snaps to grid (Shift bypasses), clamps to `getMaxWallCurveOffset`,
 * normalizes via `normalizeWallCurveOffset`. Same single-undo dance — the
 * dispatcher handles snapshot / pause / resume around `apply`. Lives in
 * the same file as the endpoint affordance to keep the two fence
 * floor-plan drags side-by-side (both publish to `useLiveNodeOverrides`,
 * both committed on pointer-up).
 */
export declare const fenceCurveAffordance: FloorplanAffordance<FenceNode>;
export declare const fenceMoveEndpointAffordance: FloorplanAffordance<FenceNode>;
//# sourceMappingURL=floorplan-affordances.d.ts.map