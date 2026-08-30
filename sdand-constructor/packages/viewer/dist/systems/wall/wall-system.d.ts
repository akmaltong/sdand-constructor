import { type AnyNode, type WallMiterData, type WallNode } from '@pascal-app/core';
import * as THREE from 'three';
export declare const WallSystem: () => null;
/**
 * Generates extruded wall geometry with mitering and cutouts
 *
 * Key insight from demo: polygon is built in WORLD coordinates first,
 * then we transform to wall-local for the 3D mesh.
 */
export declare function generateExtrudedWall(wallNode: WallNode, childrenNodes: AnyNode[], miterData: WallMiterData, slabElevation?: number): THREE.BufferGeometry;
//# sourceMappingURL=wall-system.d.ts.map