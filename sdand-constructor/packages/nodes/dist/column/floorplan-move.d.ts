import { type ColumnNode, type FloorplanMoveTarget } from '@pascal-app/core';
/**
 * 2D floor-plan move handler for column — mirrors `itemFloorplanMoveTarget`:
 * each pointermove writes the absolute world-plan position straight to
 * `useScene` (history paused by the overlay). The 2D SVG and the 3D group
 * transform both read `node.position` reactively, so they stay in lockstep;
 * the overlay's snapshot-diff makes the drag one undoable step. `canCommit`
 * only validates.
 *
 * Columns previously fell through to the overlay's generic free-translate
 * path, which aligned a column by its bbox *centre* and gathered candidates
 * from SVG bounding boxes only (missing wall faces / diagonal walls). Routing
 * through a kind-specific target gives column the same footprint-edge
 * alignment as shelf / item — including snapping flush to wall faces (the
 * pillar↔wall case this whole feature targets).
 *
 * Earlier this used the `useLiveTransforms` + imperative-mesh pattern; for a
 * `position`-field kind that leaves the 3D group stuck at the old spot on
 * commit (nothing reconciles it off the cleared live transform, since the
 * geometry doesn't rebuild on a position-only change). See the shelf handler
 * for the full rationale.
 *
 * Column stores rotation as a scalar (not a tuple); position is `[x, y, z]`.
 */
export declare const columnFloorplanMoveTarget: FloorplanMoveTarget<ColumnNode>;
//# sourceMappingURL=floorplan-move.d.ts.map