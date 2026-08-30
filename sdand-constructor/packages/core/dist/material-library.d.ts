import { type MaterialPresetPayload } from './schema/material';
export type MaterialCatalogItem = {
    id: string;
    label: string;
    category: MaterialCategory;
    description?: string;
    previewThumbnailUrl?: string;
    previewColor?: string;
    preset: MaterialPresetPayload;
};
export declare const MATERIAL_CATEGORIES: readonly ["wood", "flooring", "roof", "other"];
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
export declare const MATERIAL_CATALOG: MaterialCatalogItem[];
export declare function getMaterialsForCategory(category: MaterialCategory): MaterialCatalogItem[];
export declare function getCatalogMaterialById(id?: string): MaterialCatalogItem | undefined;
export declare const LIBRARY_MATERIAL_REF_PREFIX = "library:";
export declare function toLibraryMaterialRef(id: string): string;
export declare function getLibraryMaterialIdFromRef(materialRef?: string | null): string | null;
export declare function getMaterialPresetByRef(materialRef?: string | null): MaterialPresetPayload | null;
//# sourceMappingURL=material-library.d.ts.map