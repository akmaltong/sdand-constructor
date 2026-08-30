import { createMaterial, createMaterialFromPresetRef } from '@pascal-app/viewer';
function buildPreviewMaterial(material, materialPreset) {
    if (materialPreset)
        return createMaterialFromPresetRef(materialPreset);
    if (material)
        return createMaterial(material);
    return null;
}
export const surfacePaintCapability = {
    // One paintable surface — every face resolves to it.
    resolveRole: () => 'surface',
    buildPatch: ({ material, materialPreset }) => ({ material, materialPreset }),
    applyPreview: ({ material, materialPreset, root }) => {
        const preview = buildPreviewMaterial(material, materialPreset);
        if (!preview)
            return null;
        // The kinds register a group, so walk the subtree and swap every child
        // mesh's material, recording a restore for each.
        const restores = [];
        root.traverse((object) => {
            const mesh = object;
            if (!mesh.isMesh)
                return;
            const previous = mesh.material;
            mesh.material = preview;
            restores.push(() => {
                mesh.material = previous;
            });
        });
        if (restores.length === 0)
            return null;
        return () => {
            for (let i = restores.length - 1; i >= 0; i -= 1)
                restores[i]?.();
        };
    },
    getEffectiveMaterial: ({ node }) => {
        const n = node;
        return { material: n.material, materialPreset: n.materialPreset };
    },
};
