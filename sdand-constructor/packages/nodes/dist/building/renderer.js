'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { NodeRenderer, useNodeEvents } from '@pascal-app/viewer';
import { useRef } from 'react';
export const BuildingRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, node.type, ref);
    const handlers = useNodeEvents(node, 'building');
    return (_jsx("group", { position: node.position, ref: ref, rotation: [node.rotation[0], node.rotation[1], node.rotation[2]], ...handlers, children: (node.children ?? []).map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId))) }));
};
export default BuildingRenderer;
