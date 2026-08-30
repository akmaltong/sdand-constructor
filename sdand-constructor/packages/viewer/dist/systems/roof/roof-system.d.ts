import { type RoofSegmentNode } from '@pascal-app/core';
import * as THREE from 'three';
import { Brush } from 'three-bvh-csg';
export declare const RoofSystem: () => null;
/**
 * Four dummy materials used as identity placeholders during CSG. Shared
 * across every input brush so three-bvh-csg can preserve reference
 * equality on the result and `mapRoofGroupMaterialIndex` can map result
 * groups back to slots 0..3. Exposed so kinds that compose additional
 * CSG ops on top of `getRoofSegmentBrushes` (e.g. dormer) use the same
 * identity refs.
 */
export declare const roofCsgDummyMats: [
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial,
    THREE.MeshBasicMaterial
];
export declare const ROOF_MATERIAL_SLOT_COUNT = 4;
export declare function mapRoofGroupMaterialIndex(groupMaterialIndex: number | undefined, csgMaterials: THREE.Material[], matToIndex: Map<THREE.Material, number>): number;
/**
 * Generate complete hollow-shell geometry for a roof segment.
 * Ports the prototype's CSG approach using three-bvh-csg.
 */
export declare function getRoofSegmentBrushes(node: RoofSegmentNode): {
    deckSlab: Brush;
    shinSlab: Brush;
    wallBrush: Brush;
    innerBrush: Brush;
} | null;
export declare function generateRoofSegmentGeometry(node: RoofSegmentNode): THREE.BufferGeometry;
export declare function remapRoofShellFaces(geometry: THREE.BufferGeometry, node: RoofSegmentNode): void;
export type SurfaceFrame = {
    point: THREE.Vector3;
    normal: THREE.Vector3;
};
/**
 * Returns the outer roof surface frame (point + normal) at a given segment-local XZ.
 * This is used for skylight placement + cut direction so cutouts remain perpendicular
 * to the true roof surface even on multi-slope roofs (gambrel/mansard/dutch).
 */
export declare function getRoofOuterSurfaceFrameAtPoint(segment: RoofSegmentNode, lx: number, lz: number): SurfaceFrame;
//# sourceMappingURL=roof-system.d.ts.map