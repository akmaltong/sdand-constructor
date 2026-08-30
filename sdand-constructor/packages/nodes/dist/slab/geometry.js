import { getMaterialPresetByRef } from '@pascal-app/core';
import { applyMaterialPresetToMaterials, createDefaultMaterial, createMaterial, createSurfaceRoleMaterial, DEFAULT_SLAB_MATERIAL, generateSlabGeometry, } from '@pascal-app/viewer';
import { FrontSide, Group, Mesh } from 'three';
const slabMaterialCache = new Map();
function getSlabMaterial(node, shading, textures, colorPreset, sceneTheme) {
    // Untextured slabs (and everything in textures-off mode) take the themed
    // 'floor' role colour. createSurfaceRoleMaterial returns a shared cached
    // material, so it is returned as-is without the mutation below.
    // FrontSide — DoubleSide on the role material's NodeMaterial poisons the
    // MRT scene pass (see `materials.ts` line 77 / glazing fix 9400f1c5).
    // Slab side faces still render correctly because `generateSlabGeometry`
    // produces outward-facing normals on the top, bottom, and perimeter.
    if (!textures || (!node.materialPreset && !node.material)) {
        return createSurfaceRoleMaterial('floor', colorPreset, FrontSide, sceneTheme);
    }
    const cacheKey = JSON.stringify({
        shading,
        material: node.material ?? null,
        materialPreset: node.materialPreset ?? null,
    });
    const cached = slabMaterialCache.get(cacheKey);
    if (cached)
        return cached;
    const preset = getMaterialPresetByRef(node.materialPreset);
    const material = preset
        ? createDefaultMaterial('#ffffff', 0.5, shading)
        : node.material
            ? createMaterial(node.material, shading).clone()
            : DEFAULT_SLAB_MATERIAL(shading).clone();
    if (preset) {
        applyMaterialPresetToMaterials(material, preset);
    }
    const slabMaterial = material;
    slabMaterial.transparent = false;
    slabMaterial.opacity = 1;
    slabMaterial.alphaMap = null;
    // FrontSide — user-supplied materials may be NodeMaterials, and DoubleSide
    // on any NodeMaterial in the MRT scene pass poisons the render context
    // (see `materials.ts` line 77 / glazing fix 9400f1c5).
    slabMaterial.side = FrontSide;
    slabMaterial.depthWrite = true;
    slabMaterial.needsUpdate = true;
    slabMaterialCache.set(cacheKey, material);
    return material;
}
export function buildSlabGeometry(node, _ctx, shading = 'rendered', textures = true, colorPreset = 'clay', sceneTheme) {
    const group = new Group();
    const geometry = generateSlabGeometry(node);
    const material = getSlabMaterial(node, shading, textures, colorPreset, sceneTheme);
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const elevation = node.elevation ?? 0.05;
    if (elevation < 0)
        mesh.position.y = elevation;
    group.add(mesh);
    return group;
}
