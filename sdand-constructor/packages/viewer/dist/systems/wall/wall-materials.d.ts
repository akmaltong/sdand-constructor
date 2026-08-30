import { type WallNode } from '@pascal-app/core';
import { type Material } from 'three';
import { type ColorPreset, type RenderShading } from '../../lib/materials';
export type WallMaterialArray = [Material, Material, Material];
export interface WallMaterials {
    visible: WallMaterialArray;
    invisible: WallMaterialArray;
    deleteVisible: WallMaterialArray;
    deleteInvisible: WallMaterialArray;
    highlightedVisible: WallMaterialArray;
    highlightedInvisible: WallMaterialArray;
    materialHash: string;
}
export declare function getWallMaterialHash(wallNode: WallNode, shading: RenderShading): string;
export declare function getMaterialsForWall(wallNode: WallNode, shading?: RenderShading, textures?: boolean, colorPreset?: ColorPreset, sceneTheme?: string): WallMaterials;
export declare function getVisibleWallMaterials(wallNode: WallNode, shading?: RenderShading, textures?: boolean, colorPreset?: ColorPreset, sceneTheme?: string): WallMaterialArray;
//# sourceMappingURL=wall-materials.d.ts.map