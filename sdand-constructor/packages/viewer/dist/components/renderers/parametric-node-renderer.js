'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useLiveNodeOverrides, useLiveTransforms, useRegistry, useScene, } from '@pascal-app/core';
import { useLayoutEffect, useRef } from 'react';
import { useNodeEvents } from '../../hooks/use-node-events';
import { NodeRenderer } from './node-renderer';
export const ParametricNodeRenderer = ({ node }) => {
    const ref = useRef(null);
    const n = node;
    const handlers = useNodeEvents(node, node.type);
    const liveTransform = useLiveTransforms((s) => s.get(node.id));
    // Registry arrow handles (rotation gizmo, position-affecting patches)
    // write to `useLiveNodeOverrides`. GeometrySystem already merges that
    // for the mesh body; we also fold it into the outer group's
    // position/rotation so the rotation arrow shows live motion instead
    // of snapping only on commit. Per-node subscription so unrelated
    // override writes don't re-render the whole tree.
    const liveOverride = useLiveNodeOverrides((s) => s.overrides.get(node.id));
    const overrideRotation = liveOverride?.rotation;
    const overridePosition = liveOverride?.position;
    useRegistry(node.id, node.type, ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    const position = liveTransform?.position ?? overridePosition ?? n.position ?? [0, 0, 0];
    const rawRotation = overrideRotation ?? n.rotation;
    const rotation = liveTransform?.rotation !== undefined
        ? [0, liveTransform.rotation, 0]
        : typeof rawRotation === 'number'
            ? [0, rawRotation, 0]
            : (rawRotation ?? [0, 0, 0]);
    return (_jsx("group", { position: position, ref: ref, rotation: rotation, visible: n.visible !== false, ...handlers, children: Array.isArray(n.children) &&
            n.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, `${node.id}:${childId}`))) }));
};
