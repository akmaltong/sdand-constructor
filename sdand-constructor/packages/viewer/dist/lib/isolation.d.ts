import type { AnyNodeId } from '@pascal-app/core';
import type { Object3D } from 'three';
/** True while an isolation filter is applied (see {@link applyIsolation}). */
export declare function isIsolationActive(): boolean;
/**
 * Compute the union of every isolated subtree's `Object3D` descendants.
 *
 * Pure traversal — exported so future "focus mode" / debug tooling can
 * reuse the same definition of "what's in the isolated set". Each root
 * is walked via `Object3D.traverse` (the live Three.js graph, not the
 * data-model `children` array — those can disagree when systems mount
 * synthesized sub-meshes that the data model doesn't track).
 */
export declare function collectIsolationSubtree(ids: ReadonlyArray<string>): Set<Object3D>;
/**
 * Imperative visibility filter on the live `sceneRegistry`. Hides every
 * registered group (and its synthesized child meshes) outside the
 * isolated subtree by disabling the {@link SCENE_LAYER} bit on the
 * relevant `Object3D.layers` masks.
 *
 * Why layers instead of `obj.visible = false`? Three.js's visibility
 * flag *cascades* — hiding a parent hides every descendant — so we
 * can't hide a host wall while keeping a door rendered inside it.
 * Layer masks are per-object and don't cascade: `WebGLRenderer
 * .projectObject` skips objects whose layer mask doesn't intersect the
 * camera's, but always recurses into their children. So we can disable
 * `SCENE_LAYER` on the wall and the door (hosted under it in the
 * scene graph) still renders, with its local position relative to the
 * wall preserved automatically by the matrix walk.
 *
 * The original `layers.mask` is stashed under a private Symbol so
 * {@link clearIsolation} can restore the exact prior state.
 *
 * Pass `null` to clear isolation (equivalent to calling
 * {@link clearIsolation}).
 */
export declare function applyIsolation(ids: ReadonlyArray<AnyNodeId> | null): void;
export declare function clearIsolation(): void;
//# sourceMappingURL=isolation.d.ts.map