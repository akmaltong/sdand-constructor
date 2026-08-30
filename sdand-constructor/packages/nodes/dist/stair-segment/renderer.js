'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry, useScene, } from '@pascal-app/core';
import { getStraightStairSegmentBodyMaterials, useNodeEvents, useViewer } from '@pascal-app/viewer';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPlaceholderGeometry } from '../shared/placeholder-geometry';
export const StairSegmentRenderer = ({ node }) => {
    const ref = useRef(null);
    const nodes = useScene((state) => state.nodes);
    useRegistry(node.id, 'stair-segment', ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    const handlers = useNodeEvents(node, 'stair-segment');
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    const parentNode = node.parentId
        ? nodes[node.parentId]
        : undefined;
    const material = useMemo(() => {
        return getStraightStairSegmentBodyMaterials(node, parentNode, shading, textures, colorPreset);
    }, [
        shading,
        textures,
        colorPreset,
        node.materialPreset,
        node.material,
        node.material?.preset,
        node.material?.properties,
        node.material?.texture,
        parentNode?.materialPreset,
        parentNode?.material,
        parentNode?.material?.preset,
        parentNode?.material?.properties,
        parentNode?.material?.texture,
        parentNode?.railingMaterialPreset,
        parentNode?.railingMaterial,
        parentNode?.sideMaterialPreset,
        parentNode?.sideMaterial,
        parentNode?.treadMaterialPreset,
        parentNode?.treadMaterial,
        node,
        parentNode,
    ]);
    // 2 groups map 1:1 to the stair segment's 2-material array (body + tread).
    const placeholderGeometry = useMemo(() => createPlaceholderGeometry(2), []);
    useEffect(() => {
        return () => {
            placeholderGeometry.dispose();
        };
    }, [placeholderGeometry]);
    return (_jsx("mesh", { geometry: placeholderGeometry, material: material, position: node.position, ref: ref, "rotation-y": node.rotation, visible: node.visible, ...handlers }));
};
export default StairSegmentRenderer;
