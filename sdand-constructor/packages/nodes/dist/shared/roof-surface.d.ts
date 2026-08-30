import { type RoofSegmentNode } from '@pascal-app/core';
import * as THREE from 'three';
export declare function getSurfaceY(lx: number, lz: number, seg: RoofSegmentNode): number;
export declare function getAnalyticalNormal(lx: number, lz: number, seg: RoofSegmentNode): THREE.Vector3;
export declare function surfaceQuatFromNormal(normal: THREE.Vector3, out: THREE.Quaternion): THREE.Quaternion;
//# sourceMappingURL=roof-surface.d.ts.map