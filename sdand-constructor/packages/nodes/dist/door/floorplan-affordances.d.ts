import { type DoorNode, type FloorplanAffordance } from '@pascal-app/core';
/**
 * 2D drag affordance for the door's width side-arrows. Sister to the 3D
 * `DoorSideArrow` width drag in `packages/editor/src/components/editor/
 * door-side-handles.tsx` — both anchor at the opposite door edge and clamp
 * to wall bounds.
 *
 * Payload encodes which edge the user grabbed:
 *   - `'start'`: arrow at the door edge closer to `wall.start`. The
 *     opposite edge (toward `wall.end`) stays fixed.
 *   - `'end'`: arrow at the edge closer to `wall.end`. The wall-start
 *     edge stays fixed.
 *
 * Uses the scene-write preview pattern (writes directly to `useScene`
 * each tick): the registry layer's `effectiveNode` only merges live
 * overrides for walls, so an override-based preview wouldn't show on
 * doors. The dispatcher snapshots / pauses history at start, so per-tick
 * scene writes still collapse to one undoable entry on commit.
 */
export declare const doorWidthAffordance: FloorplanAffordance<DoorNode>;
//# sourceMappingURL=floorplan-affordances.d.ts.map