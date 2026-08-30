import { type NodeDefinition } from '@pascal-app/core';
import { DormerNode } from './schema';
/**
 * Dormer — a small house-shaped protrusion sitting on top of a roof
 * segment. The window opening is inlined into the dormer's schema
 * (window* fields drive parametric geometry on the front face), not
 * a hosted child node — so `relations.hosts` stays unset.
 *
 * **Scope of this port — stub.** Schema is complete (every field from
 * the archive, including the four per-surface material slots and the
 * full window-opening field set). Geometry renders a simple house
 * silhouette (box body + triangular gable roof) for all `roofType`
 * variants — the archive's variant-specific dormer roof shapes,
 * window opening + frame, sill, and the CSG trim where the dormer
 * meets the host roof are deferred. Per-surface paints (`topMaterial`,
 * `sideMaterial`, `wallMaterial`) resolve via the shared helper from
 * core but only roof / wall surfaces are emitted by the stub geometry.
 */
export declare const dormerDefinition: NodeDefinition<typeof DormerNode>;
//# sourceMappingURL=definition.d.ts.map