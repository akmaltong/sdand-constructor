import { createPolygonAddVertexAffordance, createPolygonMoveEdgeAffordance, createPolygonVertexAffordance, } from '../shared/polygon-vertex-affordance';
/**
 * 2D drag affordances for ceiling. Same three operations as slab
 * (`move-vertex`, `add-vertex`, `move-edge`), each accepting an
 * optional `holeIndex`. See `slab/floorplan-affordances.ts` for the
 * full contract.
 */
export const ceilingMoveVertexAffordance = createPolygonVertexAffordance('ceiling');
export const ceilingAddVertexAffordance = createPolygonAddVertexAffordance('ceiling');
export const ceilingMoveEdgeAffordance = createPolygonMoveEdgeAffordance('ceiling');
