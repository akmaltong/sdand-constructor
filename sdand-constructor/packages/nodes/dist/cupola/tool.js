'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { CupolaNode, emitter, sceneRegistry, useScene, } from '@pascal-app/core';
import { triggerSFX } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { resolveRoofSegmentHit } from '../shared/roof-segment-hit';
import { getAnalyticalNormal, surfaceQuatFromNormal } from '../shared/roof-surface';
import { cupolaDefinition } from './definition';
import CupolaPreview from './preview';
const worldPoint = new THREE.Vector3();
/**
 * Cupola placement tool. Mounts when the palette activates the cupola kind;
 * listens for `roof:*` events; on click commits a new `CupolaNode` parented
 * to the targeted segment with segment-local coordinates. Mirrors box-vent.
 */
const CupolaTool = () => {
    const activeBuildingId = useViewer((s) => s.selection.buildingId);
    const setSelection = useViewer((s) => s.setSelection);
    const [previewPos, setPreviewPos] = useState(null);
    const [previewSurfaceQuat, setPreviewSurfaceQuat] = useState(null);
    const [previewYaw, setPreviewYaw] = useState(0);
    const lastSnapRef = useRef(null);
    const previewNode = useMemo(() => CupolaNode.parse({
        ...cupolaDefinition.defaults(),
        name: 'Cupola',
        position: [0, 0, 0],
        rotation: 0,
    }), []);
    useEffect(() => {
        if (!activeBuildingId)
            return;
        const worldToBuildingLocal = (wx, wy, wz) => {
            const buildingObj = sceneRegistry.nodes.get(activeBuildingId);
            if (!buildingObj)
                return [wx, wy, wz];
            worldPoint.set(wx, wy, wz);
            buildingObj.worldToLocal(worldPoint);
            return [worldPoint.x, worldPoint.y, worldPoint.z];
        };
        const updatePreview = (event) => {
            const wx = event.position[0];
            const wy = event.position[1];
            const wz = event.position[2];
            const sx = Math.round(wx * 20) / 20;
            const sz = Math.round(wz * 20) / 20;
            const prev = lastSnapRef.current;
            if (!prev || prev[0] !== sx || prev[1] !== sz) {
                triggerSFX('sfx:grid-snap');
                lastSnapRef.current = [sx, sz];
            }
            const hit = resolveRoofSegmentHit(event.node, wx, wy, wz);
            if (!hit)
                return;
            const normal = getAnalyticalNormal(hit.localX, hit.localZ, hit.segment);
            setPreviewSurfaceQuat(surfaceQuatFromNormal(normal, new THREE.Quaternion()));
            setPreviewYaw((event.node.rotation ?? 0) + (hit.segment.rotation ?? 0));
            setPreviewPos(worldToBuildingLocal(wx, wy, wz));
            event.stopPropagation();
        };
        const onClick = (event) => {
            const hit = resolveRoofSegmentHit(event.node, event.position[0], event.position[1], event.position[2]);
            if (!hit)
                return;
            const state = useScene.getState();
            const cupola = CupolaNode.parse({
                ...cupolaDefinition.defaults(),
                name: 'Cupola',
                roofSegmentId: hit.segment.id,
                position: [hit.localX, hit.localY, hit.localZ],
                rotation: 0,
            });
            state.createNode(cupola, hit.segment.id);
            state.dirtyNodes.add(hit.segment.id);
            setSelection({ selectedIds: [cupola.id] });
            triggerSFX('sfx:item-place');
            event.stopPropagation();
        };
        emitter.on('roof:move', updatePreview);
        emitter.on('roof:enter', updatePreview);
        emitter.on('roof:click', onClick);
        return () => {
            emitter.off('roof:move', updatePreview);
            emitter.off('roof:enter', updatePreview);
            emitter.off('roof:click', onClick);
        };
    }, [activeBuildingId, setSelection]);
    if (!activeBuildingId || !previewPos || !previewSurfaceQuat)
        return null;
    return (_jsx("group", { position: previewPos, children: _jsx("group", { "rotation-y": previewYaw, children: _jsx("group", { quaternion: previewSurfaceQuat, children: _jsx(CupolaPreview, { node: previewNode }) }) }) }));
};
export default CupolaTool;
