import { type RoofNode } from '@pascal-app/core';
import type * as THREE from 'three';
import { type ColorPreset, type RenderShading } from '../../lib/materials';
export type RoofMaterialArray = [THREE.Material, THREE.Material, THREE.Material, THREE.Material];
export declare function getRoofMaterialArray(node: RoofNode, shading?: RenderShading, textures?: boolean, colorPreset?: ColorPreset, sceneTheme?: string): RoofMaterialArray | null;
//# sourceMappingURL=roof-materials.d.ts.map