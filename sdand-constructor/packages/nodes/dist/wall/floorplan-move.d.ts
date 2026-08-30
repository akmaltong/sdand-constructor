import { type FloorplanMoveTarget, type WallNode } from '@pascal-app/core';
/**
 * 2D floor-plan move handler for wall.
 *
 * Mirrors the 3D `MoveWallTool` junction-plan behavior so dragging a
 * wall in the floor plan produces the same scene topology as dragging
 * it in 3D: linked corners cascade, same-direction collapsed walls
 * delete, off-axis branches stay rectilinear with a new bridge wall
 * inserted between the original and new corner.
 *
 * Tick (`apply`) — publishes per-frame `{ start, end }` overrides to
 * `useLiveNodeOverrides` for the moved wall + every linked wall.
 * `useScene` stays at the pre-drag values throughout the drag; the
 * `WallSystem` and the 2D floor-plan layer fold the overrides in when
 * reading endpoints, so the visual preview updates without churning
 * zustand. Bridge creates and wall deletes are still deferred to
 * commit so the live preview doesn't churn the scene graph either.
 *
 * Commit (`commit`) — recomputes the plan at the final cursor position
 * and emits one atomic `applyNodeChanges` covering the moved walls,
 * the bridge wall creates, and the collapsed wall deletes — so a
 * single Ctrl-Z rolls the entire operation back. Clears the live
 * overrides after the write lands so the system reads from the new
 * committed scene state.
 *
 * Auto-slab live preview and ghost bridge SVG previews — visible in
 * the 3D tool — are deliberately deferred. Slab polygons re-derive on
 * commit through the normal scene reactions; bridges appear at commit
 * time. Follow-up work to surface them mid-drag is tracked separately.
 */
export declare const wallFloorplanMoveTarget: FloorplanMoveTarget<WallNode>;
//# sourceMappingURL=floorplan-move.d.ts.map