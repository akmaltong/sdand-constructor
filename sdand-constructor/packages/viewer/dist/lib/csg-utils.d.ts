import type * as THREE from 'three';
import { type Brush, Evaluator } from 'three-bvh-csg';
/**
 * Shared CSG primitives used by kinds whose geometry subtracts pieces
 * against their host (chimney trimmed by the roof shell, skylight
 * frame as a ring cut from a box, etc.). Lives in viewer because
 * three-bvh-csg + three-mesh-bvh are viewer-only deps; kinds living
 * in `@pascal-app/nodes` import these through the public surface.
 */
export declare function csgGeometry(brush: Brush): THREE.BufferGeometry;
export declare function csgMaterials(brush: Brush): THREE.Material[];
export declare const csgEvaluator: Evaluator;
export declare function computeGeometryBoundsTree(geometry: THREE.BufferGeometry): void;
export declare function prepareBrushForCSG(brush: Brush): void;
export { ADDITION, Brush, SUBTRACTION } from 'three-bvh-csg';
//# sourceMappingURL=csg-utils.d.ts.map