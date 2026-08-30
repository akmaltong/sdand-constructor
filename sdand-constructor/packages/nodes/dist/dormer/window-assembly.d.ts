import type { DormerNode, RoofSegmentNode } from '@pascal-app/core';
import * as THREE from 'three';
/**
 * Renders the window opening assembly (frame bars, glass panes, sill)
 * on each exposed gable face of a dormer. Owns its geometry lifecycle
 * (build via `buildDormerWindowGeometries`, dispose on unmount) so the
 * renderer doesn't have to.
 *
 * Mounted inside the dormer's rotation group, in dormer-mesh-local
 * coordinates. The CSG cut on the wall is performed separately inside
 * the viewer's `generateDormerGeometry`; the geometry built here is
 * sized to match that cut.
 */
declare const DormerWindowAssembly: ({ node, segment, frameMaterial, glassMaterial, }: {
    node: DormerNode;
    segment: RoofSegmentNode;
    frameMaterial: THREE.Material;
    glassMaterial: THREE.Material;
}) => import("react").JSX.Element;
export default DormerWindowAssembly;
//# sourceMappingURL=window-assembly.d.ts.map