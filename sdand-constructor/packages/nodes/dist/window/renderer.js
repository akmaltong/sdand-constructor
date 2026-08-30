'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry, useScene } from '@pascal-app/core';
import { createMaterial, DEFAULT_WINDOW_MATERIAL, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { useLayoutEffect, useMemo, useRef } from 'react';
export const WindowRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, 'window', ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    const handlers = useNodeEvents(node, 'window');
    const shading = useViewer((s) => s.shading);
    const isTransient = !!node.metadata?.isTransient;
    const material = useMemo(() => {
        const mat = node.material;
        if (!mat)
            return DEFAULT_WINDOW_MATERIAL(shading);
        return createMaterial(mat, shading);
    }, [
        shading,
        node.material,
        node.material?.preset,
        node.material?.properties,
        node.material?.texture,
    ]);
    return (_jsx("mesh", { material: material, position: node.position, ref: ref, rotation: node.rotation, visible: node.visible, ...(isTransient ? {} : handlers), children: _jsx("boxGeometry", { args: [0, 0, 0] }) }));
};
export default WindowRenderer;
