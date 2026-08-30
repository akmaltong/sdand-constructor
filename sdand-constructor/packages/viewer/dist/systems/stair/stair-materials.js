import { getEffectiveStairSurfaceMaterial, } from '@pascal-app/core';
import { createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, DEFAULT_STAIR_MATERIAL, } from '../../lib/materials';
const stairBodyMaterialCache = new Map();
const stairRailingMaterialCache = new Map();
function getSurfaceMaterialSignature(spec) {
    return JSON.stringify({
        material: spec.material ?? null,
        materialPreset: spec.materialPreset ?? null,
    });
}
function createResolvedMaterial(material, materialPreset, shading, textures, colorPreset) {
    if (!textures) {
        return createSurfaceRoleMaterial('joinery', colorPreset);
    }
    if (materialPreset) {
        return createMaterialFromPresetRef(materialPreset, shading) ?? DEFAULT_STAIR_MATERIAL(shading);
    }
    if (material) {
        return createMaterial(material, shading);
    }
    return DEFAULT_STAIR_MATERIAL(shading);
}
export function getStairBodyMaterials(stair, shading = 'rendered', textures = true, colorPreset = 'clay') {
    const tread = getEffectiveStairSurfaceMaterial(stair, 'tread');
    const side = getEffectiveStairSurfaceMaterial(stair, 'side');
    const cacheKey = JSON.stringify({
        shading,
        textures,
        colorPreset,
        tread: getSurfaceMaterialSignature(tread),
        side: getSurfaceMaterialSignature(side),
    });
    const cached = stairBodyMaterialCache.get(cacheKey);
    if (cached)
        return cached;
    const materials = [
        createResolvedMaterial(tread.material, tread.materialPreset, shading, textures, colorPreset),
        createResolvedMaterial(side.material, side.materialPreset, shading, textures, colorPreset),
    ];
    stairBodyMaterialCache.set(cacheKey, materials);
    return materials;
}
export function getStairRailingMaterial(stair, shading = 'rendered', textures = true, colorPreset = 'clay') {
    const railing = getEffectiveStairSurfaceMaterial(stair, 'railing');
    const cacheKey = JSON.stringify({
        shading,
        textures,
        colorPreset,
        railing: getSurfaceMaterialSignature(railing),
    });
    const cached = stairRailingMaterialCache.get(cacheKey);
    if (cached)
        return cached;
    const material = createResolvedMaterial(railing.material, railing.materialPreset, shading, textures, colorPreset);
    stairRailingMaterialCache.set(cacheKey, material);
    return material;
}
export function getStraightStairSegmentBodyMaterials(segment, parentNode, shading = 'rendered', textures = true, colorPreset = 'clay') {
    if (segment.material !== undefined || typeof segment.materialPreset === 'string') {
        const override = createResolvedMaterial(segment.material, segment.materialPreset, shading, textures, colorPreset);
        return [override, override];
    }
    if (parentNode) {
        return getStairBodyMaterials(parentNode, shading, textures, colorPreset);
    }
    if (!textures) {
        const material = createSurfaceRoleMaterial('joinery', colorPreset);
        return [material, material];
    }
    return [DEFAULT_STAIR_MATERIAL(shading), DEFAULT_STAIR_MATERIAL(shading)];
}
