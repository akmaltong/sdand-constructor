'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, SolarPanelNode, sceneRegistry, useScene, } from '@pascal-app/core';
import { triggerSFX } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { resolveRoofSegmentHit } from '../shared/roof-segment-hit';
import { getAnalyticalNormal, surfaceQuatFromNormal } from '../shared/roof-surface';
import { solarPanelDefinition } from './definition';
import SolarPanelPreview from './preview';
const worldPoint = new THREE.Vector3();
/**
 * Solar panel placement tool. The preview shows the array at the
 * cursor with the analytical roof-surface tilt applied (no raycast in
 * the placement preview — uses `getAnalyticalNormal` derived from the
 * segment's roof type + dimensions). On commit, snaps the position's
 * Y to the segment's surface height and stores the analytical normal
 * in the node so the renderer reproduces the same orientation.
 */
const SolarPanelTool = () => {
    const activeBuildingId = useViewer((s) => s.selection.buildingId);
    const setSelection = useViewer((s) => s.setSelection);
    const [previewPos, setPreviewPos] = useState(null);
    const [previewYaw, setPreviewYaw] = useState(0);
    const [previewSurfaceQuat, setPreviewSurfaceQuat] = useState(null);
    const lastSnapRef = useRef(null);
    // Compact 2×3 ghost (rows × columns) — small enough to read as a
    // pointer, large enough to show the array's orientation/aspect.
    // The committed panel still uses the full residential defaults (4×5).
    const previewNode = useMemo(() => SolarPanelNode.parse({
        ...solarPanelDefinition.defaults(),
        name: 'Solar Panel',
        position: [0, 0, 0],
        rotation: 0,
        rows: 2,
        columns: 3,
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
            // Use the raycast hit Y (segment-local) and analytical normal so the
            // committed panel sits exactly where the ghost was rendered. The
            // analytical `getSurfaceY` is the bare-rafter height — it ignores
            // deck/shingle layers and sinks the panel into the roof, producing
            // a visible jump between ghost and committed mesh.
            const normal = getAnalyticalNormal(hit.localX, hit.localZ, hit.segment);
            const panel = SolarPanelNode.parse({
                ...solarPanelDefinition.defaults(),
                name: 'Solar Panel',
                roofSegmentId: hit.segment.id,
                position: [hit.localX, hit.localY, hit.localZ],
                rotation: 0,
                surfaceNormal: [normal.x, normal.y, normal.z],
            });
            state.createNode(panel, hit.segment.id);
            state.dirtyNodes.add(hit.segment.id);
            setSelection({ selectedIds: [panel.id] });
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
    return (_jsx("group", { position: previewPos, children: _jsx("group", { "rotation-y": previewYaw, children: _jsx("group", { quaternion: previewSurfaceQuat, children: _jsx(SolarPanelPreview, { node: previewNode }) }) }) }));
};
export default SolarPanelTool;
