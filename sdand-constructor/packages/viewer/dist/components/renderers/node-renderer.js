'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { nodeRegistry, useScene } from '@pascal-app/core';
import { lazy, Suspense } from 'react';
import { ParametricNodeRenderer } from './parametric-node-renderer';
// Cache lazy components by their RendererSource so React.lazy isn't re-invoked
// on every render — that would create a new Suspense boundary each time.
const lazyCache = new WeakMap();
function getRegistryRenderer(source) {
    const cached = lazyCache.get(source);
    if (cached)
        return cached;
    // GLB / instanced-GLB sources lower onto built-in renderers landed in
    // Phase 5 — for now only parametric (lazy module) sources are honored.
    if (source.kind !== 'parametric')
        return null;
    const Comp = lazy(source.module);
    lazyCache.set(source, Comp);
    return Comp;
}
export const NodeRenderer = ({ nodeId }) => {
    const node = useScene((state) => state.nodes[nodeId]);
    if (!node)
        return null;
    const def = nodeRegistry.get(node.type);
    if (!def)
        return null;
    // Two-checkbox dispatch (see wiki/architecture/node-definitions.md):
    //  1. Custom renderer — JSX-side composition for kinds that need GLB,
    //     drei, <Html>, instancing, shader materials.
    //  2. Else, if the kind ships `def.geometry`, the generic empty-group
    //     <ParametricNodeRenderer> is filled by <GeometrySystem> from the
    //     pure builder.
    if (def.renderer) {
        const Renderer = getRegistryRenderer(def.renderer);
        if (!Renderer)
            return null;
        return (_jsx(Suspense, { fallback: null, children: _jsx(Renderer, { node: node }) }));
    }
    if (def.geometry) {
        return _jsx(ParametricNodeRenderer, { node: node });
    }
    return null;
};
