import { getEffectiveWallSurfaceMaterial, getMaterialPresetByRef, getWallSurfaceMaterialSignature, resolveMaterial, } from '@pascal-app/core';
import { Color } from 'three';
import { Fn, float, fract, length, mix, positionLocal, smoothstep, step, vec2 } from 'three/tsl';
import { MeshLambertNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import { baseMaterial, createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, resolveSurfaceColor, } from '../../lib/materials';
const DEFAULT_WALL_COLOR = '#f2f0ed';
const WALL_HIGHLIGHT_PROFILES = {
    delete: {
        color: new Color('#dc2626'),
        blend: 0.76,
        emissiveBlend: 0.92,
        emissiveIntensity: 0.46,
    },
    selection: {
        color: new Color('#818cf8'),
        blend: 0.32,
        emissiveBlend: 0.7,
        emissiveIntensity: 0.42,
    },
};
const wallMaterialCache = new Map();
const dotPattern = Fn(() => {
    const scale = float(0.1);
    const dotSize = float(0.3);
    const uv = vec2(positionLocal.x, positionLocal.y).div(scale);
    const gridUV = fract(uv);
    const dist = length(gridUV.sub(0.5));
    const dots = step(dist, dotSize.mul(0.5));
    const fadeHeight = float(2.5);
    const yFade = float(1).sub(smoothstep(float(0), fadeHeight, positionLocal.y));
    return dots.mul(yFade);
});
function getSurfaceVisibleMaterial(spec, shading) {
    if (spec.materialPreset) {
        return createMaterialFromPresetRef(spec.materialPreset, shading) ?? baseMaterial(shading);
    }
    if (spec.material) {
        return createMaterial(spec.material, shading);
    }
    return baseMaterial(shading);
}
function hasExplicitMaterial(spec) {
    return Boolean(spec.materialPreset || spec.material);
}
function getSurfaceColor(spec, fallback = DEFAULT_WALL_COLOR) {
    const preset = getMaterialPresetByRef(spec.materialPreset);
    if (preset?.mapProperties?.color) {
        return preset.mapProperties.color;
    }
    if (spec.material) {
        return resolveMaterial(spec.material).color;
    }
    return fallback;
}
function getHighlightedColor(color, kind) {
    const profile = WALL_HIGHLIGHT_PROFILES[kind];
    return color.clone().lerp(profile.color, profile.blend);
}
function createHighlightedWallMaterial(material, kind) {
    const highlightedMaterial = material.clone();
    const profile = WALL_HIGHLIGHT_PROFILES[kind];
    if ('color' in highlightedMaterial && highlightedMaterial.color) {
        highlightedMaterial.color = getHighlightedColor(highlightedMaterial.color, kind);
    }
    if ('emissive' in highlightedMaterial && highlightedMaterial.emissive) {
        highlightedMaterial.emissive = highlightedMaterial.emissive
            .clone()
            .lerp(profile.color, profile.emissiveBlend);
    }
    if ('emissiveIntensity' in highlightedMaterial) {
        highlightedMaterial.emissiveIntensity = Math.max(highlightedMaterial.emissiveIntensity ?? 0, profile.emissiveIntensity);
    }
    highlightedMaterial.needsUpdate = true;
    return highlightedMaterial;
}
function createInvisibleWallMaterial(color, shading) {
    const material = shading === 'solid'
        ? new MeshLambertNodeMaterial({
            transparent: true,
            color,
            depthWrite: false,
            emissive: color,
        })
        : new MeshStandardNodeMaterial({
            transparent: true,
            color,
            depthWrite: false,
            emissive: color,
        });
    material.opacityNode = mix(float(0.0), float(0.24), dotPattern());
    return material;
}
function mapWallMaterialArray(materials, iteratee) {
    return materials.map(iteratee);
}
function disposeOwnedMaterials(materials) {
    const owned = new Set();
    materials.forEach((entry) => {
        entry.forEach((material) => {
            owned.add(material);
        });
    });
    owned.forEach((material) => {
        material.dispose();
    });
}
export function getWallMaterialHash(wallNode, shading) {
    return JSON.stringify({
        shading,
        interior: getWallSurfaceMaterialSignature(getEffectiveWallSurfaceMaterial(wallNode, 'interior')),
        exterior: getWallSurfaceMaterialSignature(getEffectiveWallSurfaceMaterial(wallNode, 'exterior')),
    });
}
export function getMaterialsForWall(wallNode, shading = 'rendered', textures = true, colorPreset = 'clay', sceneTheme) {
    const cacheKey = `${wallNode.id}-${shading}-${textures}-${colorPreset}-${sceneTheme ?? 'base'}`;
    const materialHash = textures
        ? getWallMaterialHash(wallNode, shading)
        : JSON.stringify({ textures, colorPreset, sceneTheme });
    const existing = wallMaterialCache.get(cacheKey);
    if (existing && existing.materialHash === materialHash) {
        return existing;
    }
    if (existing) {
        disposeOwnedMaterials([
            existing.invisible,
            existing.deleteVisible,
            existing.deleteInvisible,
            existing.highlightedVisible,
            existing.highlightedInvisible,
        ]);
    }
    const interiorSpec = getEffectiveWallSurfaceMaterial(wallNode, 'interior');
    const exteriorSpec = getEffectiveWallSurfaceMaterial(wallNode, 'exterior');
    const wallRoleMaterial = createSurfaceRoleMaterial('wall', colorPreset, undefined, sceneTheme);
    // Untextured surfaces take the themed wall role colour even with textures on;
    // only surfaces with an explicit preset/material keep their texture.
    const visible = textures
        ? [
            wallRoleMaterial,
            hasExplicitMaterial(interiorSpec)
                ? getSurfaceVisibleMaterial(interiorSpec, shading)
                : wallRoleMaterial,
            hasExplicitMaterial(exteriorSpec)
                ? getSurfaceVisibleMaterial(exteriorSpec, shading)
                : wallRoleMaterial,
        ]
        : [wallRoleMaterial, wallRoleMaterial, wallRoleMaterial];
    const wallRoleColor = resolveSurfaceColor('wall', colorPreset, sceneTheme);
    const invisible = [
        createInvisibleWallMaterial(wallRoleColor, textures ? shading : 'solid'),
        createInvisibleWallMaterial(textures ? getSurfaceColor(interiorSpec, wallRoleColor) : wallRoleColor, textures ? shading : 'solid'),
        createInvisibleWallMaterial(textures ? getSurfaceColor(exteriorSpec, wallRoleColor) : wallRoleColor, textures ? shading : 'solid'),
    ];
    const highlightedVisible = mapWallMaterialArray(visible, (material) => createHighlightedWallMaterial(material, 'selection'));
    const highlightedInvisible = mapWallMaterialArray(invisible, (material) => createHighlightedWallMaterial(material, 'selection'));
    const deleteVisible = mapWallMaterialArray(visible, (material) => createHighlightedWallMaterial(material, 'delete'));
    const deleteInvisible = mapWallMaterialArray(invisible, (material) => createHighlightedWallMaterial(material, 'delete'));
    const result = {
        visible,
        invisible,
        deleteVisible,
        deleteInvisible,
        highlightedVisible,
        highlightedInvisible,
        materialHash,
    };
    wallMaterialCache.set(cacheKey, result);
    return result;
}
export function getVisibleWallMaterials(wallNode, shading = 'rendered', textures = true, colorPreset = 'clay', sceneTheme) {
    return getMaterialsForWall(wallNode, shading, textures, colorPreset, sceneTheme).visible;
}
