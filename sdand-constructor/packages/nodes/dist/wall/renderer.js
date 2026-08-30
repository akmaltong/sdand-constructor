'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry, useScene } from '@pascal-app/core';
import { getVisibleWallMaterials, NodeRenderer, useNodeEvents, useViewer } from '@pascal-app/viewer';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPlaceholderGeometry } from '../shared/placeholder-geometry';
/**
 * Thin wall renderer.
 *
 * Mounts a placeholder mesh, registers it with `sceneRegistry`, marks the
 * node dirty so `WallSystem` fills the geometry on the next frame, and
 * recursively renders hosted children (doors / windows / wall-mounted
 * items) inside the wall's local frame.
 *
 * Behaviorally identical to the legacy `WallRenderer` in
 * `@pascal-app/viewer/components/renderers/wall/wall-renderer.tsx`.
 * Phase 6 deletes the legacy file; until then both coexist and the Phase 0
 * shims pick which one renders based on `nodeRegistry.has('wall')`.
 *
 * No `geometry` field on the wall definition yet — wall's geometry depends
 * on level-batch miter data (see `WallSystem.calculateLevelMiters`), which
 * doesn't fit the generic `(node, ctx) => Group` shape without `ctx.levelData`.
 * That decision lands in a later milestone; for now the system retains
 * ownership of the rebuild loop.
 */
const WallRenderer = ({ node }) => {
    const ref = useRef(null);
    // 3 groups map 1:1 to the wall's 3-material array (see getVisibleWallMaterials).
    const placeholderGeometry = useMemo(() => createPlaceholderGeometry(3), []);
    const collisionPlaceholderGeometry = useMemo(() => createPlaceholderGeometry(), []);
    useRegistry(node.id, 'wall', ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    useEffect(() => {
        return () => {
            placeholderGeometry.dispose();
            collisionPlaceholderGeometry.dispose();
        };
    }, [collisionPlaceholderGeometry, placeholderGeometry]);
    const handlers = useNodeEvents(node, 'wall');
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    const sceneTheme = useViewer((s) => s.sceneTheme);
    const material = getVisibleWallMaterials(node, shading, textures, colorPreset, sceneTheme);
    return (_jsxs("mesh", { castShadow: true, geometry: placeholderGeometry, material: material, receiveShadow: true, ref: ref, visible: node.visible, children: [_jsx("mesh", { geometry: collisionPlaceholderGeometry, name: "collision-mesh", visible: false, ...handlers }), (node.children ?? []).map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, `${node.id}:${childId}`)))] }));
};
export default WallRenderer;
