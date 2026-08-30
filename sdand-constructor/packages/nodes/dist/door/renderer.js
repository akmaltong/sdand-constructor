'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry, useScene } from '@pascal-app/core';
import { useNodeEvents } from '@pascal-app/viewer';
import { useLayoutEffect, useRef } from 'react';
import { MeshBasicMaterial } from 'three';
const doorHitboxMaterial = new MeshBasicMaterial({ visible: false });
export const DoorRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, 'door', ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    const handlers = useNodeEvents(node, 'door');
    const isTransient = !!node.metadata?.isTransient;
    return (_jsx("mesh", { castShadow: true, material: doorHitboxMaterial, position: node.position, receiveShadow: true, ref: ref, rotation: node.rotation, visible: node.visible, ...(isTransient ? {} : handlers), children: _jsx("boxGeometry", { args: [0, 0, 0] }) }));
};
export default DoorRenderer;
