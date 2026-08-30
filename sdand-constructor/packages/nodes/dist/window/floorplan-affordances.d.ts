import { type FloorplanAffordance, type WindowNode } from '@pascal-app/core';
/**
 * 2D drag affordance for the window's width side-arrows. Sister to the 3D
 * `WindowSideArrow` width drag in `packages/editor/src/components/editor/
 * window-side-handles.tsx` — both anchor at the opposite window edge and
 * clamp to wall bounds. Mirrors `doorWidthAffordance` 1:1 with the door
 * type swapped for the window type.
 *
 * Payload encodes which edge the user grabbed:
 *   - `'start'`: arrow at the window edge closer to `wall.start`. The
 *     opposite edge (toward `wall.end`) stays fixed.
 *   - `'end'`: arrow at the edge closer to `wall.end`. The wall-start
 *     edge stays fixed.
 *
 * Uses the scene-write preview pattern (writes directly to `useScene`
 * each tick): the registry layer's `effectiveNode` only merges live
 * overrides for walls, so an override-based preview wouldn't show on
 * windows. The dispatcher snapshots / pauses history at start, so
 * per-tick scene writes still collapse to one undoable entry on commit.
 */
export declare const windowWidthAffordance: FloorplanAffordance<WindowNode>;
//# sourceMappingURL=floorplan-affordances.d.ts.map