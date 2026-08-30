'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { getScaledDimensions, useInteractive, useLiveNodeOverrides, useRegistry, useScene, } from '@pascal-app/core';
import { baseMaterial, createDefaultMaterial, createSurfaceRoleMaterial, ErrorBoundary, glassMaterial, NodeRenderer, resolveCdnUrl, useItemLightPool, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { useAnimations } from '@react-three/drei';
import { Clone } from '@react-three/drei/core/Clone';
import { useGLTF } from '@react-three/drei/core/Gltf';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { MathUtils, MeshBasicMaterial, TextureLoader } from 'three';
import { positionLocal, smoothstep, time } from 'three/tsl';
import { getStandModel } from './stand-model-cache';
const getMaterialForOriginal = (original, shading, textures, colorPreset) => {
    if (original.name.toLowerCase() === 'glass') {
        return glassMaterial;
    }
    if (!textures)
        return createSurfaceRoleMaterial('furnishing', colorPreset);
    return original;
};
const BrokenItemFallback = ({ node }) => {
    const handlers = useNodeEvents(node, 'item');
    const shading = useViewer((s) => s.shading);
    // Учитываем node.scale — resize handle пишет туда, а mesh должен
    // растягиваться визуально сразу же (live-overrides merge выше по стеку).
    const [w, h, d] = getScaledDimensions(node);
    const material = useMemo(() => {
        const next = createDefaultMaterial('#ef4444', 1, shading);
        next.opacity = 0.6;
        next.transparent = true;
        next.wireframe = true;
        next.needsUpdate = true;
        return next;
    }, [shading]);
    return (_jsxs("mesh", { "position-y": h / 2, ...handlers, children: [_jsx("boxGeometry", { args: [w, h, d] }), _jsx("primitive", { attach: "material", object: material })] }));
};
function parsePrimitive(src) {
    if (!src)
        return null;
    if (src.startsWith('primitive:box:')) {
        const hex = src.slice('primitive:box:'.length).trim();
        return { kind: 'box', color: `#${hex.replace(/^#/, '')}` };
    }
    if (src.startsWith('primitive:tex:')) {
        return { kind: 'tex', url: src.slice('primitive:tex:'.length) };
    }
    return null;
}
const PrimitiveBoxItem = ({ node, color }) => {
    const shading = useViewer((s) => s.shading);
    // Учитываем node.scale — resize handle пишет туда, а mesh должен
    // растягиваться визуально сразу же (live-overrides merge выше по стеку).
    const [w, h, d] = getScaledDimensions(node);
    const handlers = useNodeEvents(node, 'item');
    const material = useMemo(() => createDefaultMaterial(color, 1, shading), [color, shading]);
    return (_jsxs("mesh", { castShadow: true, "position-y": h / 2, receiveShadow: true, ...handlers, children: [_jsx("boxGeometry", { args: [w, h, d] }), _jsx("primitive", { attach: "material", object: material })] }));
};
const PrimitiveTexturedItem = ({ node, url }) => {
    // Учитываем node.scale — resize handle пишет туда, а mesh должен
    // растягиваться визуально сразу же (live-overrides merge выше по стеку).
    const [w, h, d] = getScaledDimensions(node);
    const handlers = useNodeEvents(node, 'item');
    const material = useMemo(() => {
        const tex = new TextureLoader().load(url);
        return new MeshBasicMaterial({ map: tex });
    }, [url]);
    return (_jsxs("mesh", { castShadow: true, "position-y": h / 2, receiveShadow: true, ...handlers, children: [_jsx("boxGeometry", { args: [w, h, d] }), _jsx("primitive", { attach: "material", object: material })] }));
};
export const ItemRenderer = ({ node: storeNode }) => {
    const ref = useRef(null);
    useRegistry(storeNode.id, storeNode.type, ref);
    // Merge live drag overrides so the mesh transforms in real time during a
    // drag (e.g. the in-world rotate gizmo). The handle writes the in-flight
    // rotation to `useLiveNodeOverrides` on every pointer move and commits to
    // the store only on release — without this merge the item would stay put
    // until commit.
    const liveOverrides = useLiveNodeOverrides((state) => state.get(storeNode.id));
    const node = useMemo(() => (liveOverrides ? { ...storeNode, ...liveOverrides } : storeNode), [storeNode, liveOverrides]);
    const roomClearPreview = node.roomClearPreview === true;
    const primitive = parsePrimitive(node.asset.src);
    const standModel = useMemo(() => getStandModel(node.asset.src), [node.asset.src]);
    return (_jsx("group", { position: node.position, ref: ref, rotation: node.rotation, visible: node.visible, children: roomClearPreview ? (_jsx(ClearPreviewModel, { node: node })) : primitive ? (_jsxs(_Fragment, { children: [primitive.kind === 'box' ? (_jsx(PrimitiveBoxItem, { color: primitive.color, node: node })) : (_jsx(PrimitiveTexturedItem, { node: node, url: primitive.url })), node.children?.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] })) : standModel ? (_jsxs(_Fragment, { children: [_jsx(StandModelRenderer, { node: node, scene: standModel }), node.children?.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] })) : (_jsxs(_Fragment, { children: [_jsx(ErrorBoundary, { fallback: _jsx(BrokenItemFallback, { node: node }), children: _jsx(Suspense, { fallback: _jsx(PreviewModel, { node: node }), children: _jsx(ModelRenderer, { node: node }) }) }), node.children?.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] })) }));
};
const previewOpacity = smoothstep(0.42, 0.55, positionLocal.y.add(time.mul(-0.2)).mul(10).fract());
const previewMaterialCache = new Map();
function getPreviewMaterial(shading) {
    const cached = previewMaterialCache.get(shading);
    if (cached)
        return cached;
    const material = createDefaultMaterial('#cccccc', 1, shading);
    material.depthTest = false;
    material.opacityNode = previewOpacity;
    material.transparent = true;
    material.needsUpdate = true;
    previewMaterialCache.set(shading, material);
    return material;
}
const PreviewModel = ({ node }) => {
    const shading = useViewer((s) => s.shading);
    return (_jsx("mesh", { material: getPreviewMaterial(shading), "position-y": node.asset.dimensions[1] / 2, children: _jsx("boxGeometry", { args: [node.asset.dimensions[0], node.asset.dimensions[1], node.asset.dimensions[2]] }) }));
};
const ClearPreviewModel = ({ node }) => {
    const shading = useViewer((s) => s.shading);
    const [w, h, d] = getScaledDimensions(node);
    const material = useMemo(() => {
        const next = createDefaultMaterial('#ef4444', 1, shading);
        next.depthTest = false;
        next.opacity = 0.35;
        next.transparent = true;
        next.wireframe = true;
        next.needsUpdate = true;
        return next;
    }, [shading]);
    return (_jsx("mesh", { material: material, "position-y": h / 2, children: _jsx("boxGeometry", { args: [w, h, d] }) }));
};
const multiplyScales = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const applyItemMaterialOverrides = (scene, shading, textures, colorPreset) => {
    scene.traverse((child) => {
        if (child.isMesh) {
            const mesh = child;
            if (mesh.name === 'cutout') {
                child.visible = false;
                return;
            }
            let hasGlass = false;
            // Handle both single material and material array cases
            if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map((mat) => getMaterialForOriginal(mat, shading, textures, colorPreset));
                hasGlass = mesh.material.some((mat) => mat.name === 'glass');
                // Fix geometry groups that reference materialIndex beyond the material
                // array length — this causes three-mesh-bvh to crash with
                // "Cannot read properties of undefined (reading 'side')"
                const matCount = mesh.material.length;
                if (mesh.geometry.groups.length > 0) {
                    for (const group of mesh.geometry.groups) {
                        if (group.materialIndex !== undefined && group.materialIndex >= matCount) {
                            group.materialIndex = 0;
                        }
                    }
                }
            }
            else {
                mesh.material = getMaterialForOriginal(mesh.material, shading, textures, colorPreset);
                hasGlass = mesh.material.name === 'glass';
            }
            mesh.castShadow = !hasGlass;
            mesh.receiveShadow = !hasGlass;
        }
    });
};
const ModelRenderer = ({ node }) => {
    const { scene, nodes, animations } = useGLTF(resolveCdnUrl(node.asset.src) || '');
    const ref = useRef(null);
    const { actions } = useAnimations(animations, ref);
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    // Freeze the interactive definition at mount — asset schemas don't change at runtime
    const interactiveRef = useRef(node.asset.interactive);
    if (nodes.cutout) {
        nodes.cutout.visible = false;
    }
    const handlers = useNodeEvents(node, 'item');
    useEffect(() => {
        if (!node.parentId)
            return;
        useScene.getState().markDirty(node.parentId);
    }, [node.parentId]);
    useEffect(() => {
        const interactive = interactiveRef.current;
        if (!interactive)
            return;
        useInteractive.getState().initItem(node.id, interactive);
        return () => useInteractive.getState().removeItem(node.id);
    }, [node.id]);
    useMemo(() => {
        applyItemMaterialOverrides(scene, shading, textures, colorPreset);
    }, [scene, shading, textures, colorPreset]);
    const interactive = interactiveRef.current;
    const animEffect = interactive?.effects.find((e) => e.kind === 'animation') ?? null;
    const lightEffects = interactive?.effects.filter((e) => e.kind === 'light') ?? [];
    // useGLTF caches scenes, and Clone shares child geometry/material references.
    // Undo can unmount one item while another clone of the same asset still needs them.
    return (_jsxs(_Fragment, { children: [_jsx(Clone, { dispose: null, object: scene, position: node.asset.offset, ref: ref, rotation: node.asset.rotation, scale: multiplyScales(node.asset.scale || [1, 1, 1], node.scale || [1, 1, 1]), ...handlers }), animations.length > 0 && (_jsx(ItemAnimation, { actions: actions, animations: animations, animEffect: animEffect, interactive: interactive ?? null, nodeId: node.id })), lightEffects.map((effect, i) => (_jsx(ItemLightRegistrar, { effect: effect, index: i, interactive: interactive, nodeId: node.id }, i)))] }));
};
/**
 * Renderer for imported stand models: the scene is already built and cached
 * by `apps/editor/lib/stand-import.ts`, so this mounts instantly without a
 * second main-thread GLTF parse. Mirrors ModelRenderer's interactive wiring.
 * Materials are already correct (built in the worker) — no override needed.
 */
const StandModelRenderer = ({ node, scene }) => {
    const ref = useRef(null);
    const interactiveRef = useRef(node.asset.interactive);
    const handlers = useNodeEvents(node, 'item');
    // Sdand: draft-нода (placement preview, тянется за курсором) — рисуем
    // лёгкий bbox-куб вместо scene.clone(true) на всей иерархии импортированной
    // модели, иначе main thread замирает на 48 MB стенде и «зависает». Реальный
    // Clone делаем только после placement (isTransient снят).
    const isTransient = Boolean(node.metadata?.isTransient);
    const [w, h, d] = getScaledDimensions(node);
    const shading = useViewer((s) => s.shading);
    const draftMaterial = useMemo(() => createDefaultMaterial('#94a3b8', 0.55, shading), [shading]);
    const clonedScene = useMemo(() => {
        if (isTransient)
            return null;
        const cloned = scene.clone(true);
        cloned.traverse((child) => {
            if (child.isMesh) {
                child.raycast = () => { };
            }
        });
        return cloned;
    }, [scene, isTransient]);
    const calculatedScale = multiplyScales(node.asset.scale || [1, 1, 1], node.scale || [1, 1, 1]);
    useEffect(() => {
        if (!node.parentId)
            return;
        useScene.getState().markDirty(node.parentId);
    }, [node.parentId]);
    useEffect(() => {
        const interactive = interactiveRef.current;
        if (!interactive)
            return;
        useInteractive.getState().initItem(node.id, interactive);
        return () => useInteractive.getState().removeItem(node.id);
    }, [node.id]);
    const interactive = interactiveRef.current;
    const lightEffects = interactive?.effects.filter((e) => e.kind === 'light') ?? [];
    if (isTransient || !clonedScene) {
        return (_jsxs("mesh", { castShadow: true, "position-y": h / 2, receiveShadow: true, ...handlers, children: [_jsx("boxGeometry", { args: [w, h, d] }), _jsx("primitive", { attach: "material", object: draftMaterial })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("primitive", { object: clonedScene, position: node.asset.offset, ref: ref, rotation: node.asset.rotation, scale: calculatedScale, ...handlers }), lightEffects.map((effect, i) => (_jsx(ItemLightRegistrar, { effect: effect, index: i, interactive: interactive, nodeId: node.id }, i)))] }));
};
const ItemAnimation = ({ nodeId, animEffect, interactive, actions, animations, }) => {
    const activeClipRef = useRef(null);
    const fadingOutRef = useRef(null);
    // Reactive: derive target clip name — only re-renders when the clip name itself changes
    const targetClip = useInteractive((s) => {
        const values = s.items[nodeId]?.controlValues;
        if (!animEffect)
            return animations[0]?.name ?? null;
        const toggleIndex = interactive.controls.findIndex((c) => c.kind === 'toggle');
        const isOn = toggleIndex >= 0 ? Boolean(values?.[toggleIndex]) : false;
        return isOn
            ? (animEffect.clips.on ?? null)
            : (animEffect.clips.off ?? animEffect.clips.loop ?? null);
    });
    // When target clip changes: kick off the transition
    useEffect(() => {
        // Cancel any ongoing fade-out immediately
        if (fadingOutRef.current) {
            fadingOutRef.current.timeScale = 0;
            fadingOutRef.current = null;
        }
        // Move current clip to fade-out
        if (activeClipRef.current && activeClipRef.current !== targetClip) {
            const old = actions[activeClipRef.current];
            if (old?.isRunning())
                fadingOutRef.current = old;
        }
        // Start new clip at timeScale 0.01 (as 0 would cause isRunning to be false and thus not play at all), then fade in to 1
        activeClipRef.current = targetClip;
        if (targetClip) {
            const next = actions[targetClip];
            if (next) {
                next.timeScale = 0.01;
                next.play();
            }
        }
    }, [targetClip, actions]);
    // useFrame: only lerping — no logic
    useFrame((_, delta) => {
        if (fadingOutRef.current) {
            const action = fadingOutRef.current;
            action.timeScale = MathUtils.lerp(action.timeScale, 0, Math.min(delta * 5, 1));
            if (action.timeScale < 0.01) {
                action.timeScale = 0;
                fadingOutRef.current = null;
            }
        }
        if (activeClipRef.current) {
            const action = actions[activeClipRef.current];
            if (action?.isRunning() && action.timeScale < 1) {
                action.timeScale = MathUtils.lerp(action.timeScale, 1, Math.min(delta * 5, 1));
                if (1 - action.timeScale < 0.01)
                    action.timeScale = 1;
            }
        }
    });
    return null;
};
const ItemLightRegistrar = ({ nodeId, effect, interactive, index, }) => {
    useEffect(() => {
        const key = `${nodeId}:${index}`;
        useItemLightPool.getState().register(key, nodeId, effect, interactive);
        return () => useItemLightPool.getState().unregister(key);
    }, [nodeId, index, effect, interactive]);
    return null;
};
export default ItemRenderer;
