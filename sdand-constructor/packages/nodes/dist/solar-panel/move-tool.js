'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, sceneRegistry, useScene, } from '@pascal-app/core';
import { EDITOR_LAYER, markToolCancelConsumed, triggerSFX, useEditor } from '@pascal-app/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createRelativeRoofDrag, roofSegmentLocalToBuildingLocal, } from '../shared/relative-roof-drag';
import { getAnalyticalNormal, surfaceQuatFromNormal } from '../shared/roof-surface';
// MeshBasicMaterial: avoids the WebGPU "Color target has no corresponding
// fragment stage output / writeMask not zero" error that fires when
// MeshStandardMaterial (which writes to the MRT normal/roughness targets)
// is rendered in a pass whose render target lacks those attachments.
// Same fix as skylight's glass material. Visually identical for a ghost.
const previewMaterial = new THREE.MeshBasicMaterial({
    color: 0x22_44_88,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
});
export default function MoveSolarPanelTool({ node }) {
    const exitMoveMode = useCallback(() => {
        useEditor.getState().setMovingNode(null);
    }, []);
    const previewRef = useRef(null);
    const [previewPos, setPreviewPos] = useState([0, 0, 0]);
    // Yaw = roof.rotation + segment.rotation; applied as outer rotation-y
    // so the surface quat (segment-local) composes correctly — same pattern
    // as the placement tool ghost.
    const [previewYaw, setPreviewYaw] = useState(0);
    const [previewSurfaceQuat, setPreviewSurfaceQuat] = useState(new THREE.Quaternion());
    const [hasHit, setHasHit] = useState(false);
    // Compact 2×3 ghost — same size as the placement tool ghost.
    const previewGeo = useMemo(() => {
        const ghostRows = 2;
        const ghostCols = 3;
        const totalW = ghostCols * node.panelWidth + (ghostCols - 1) * node.gapX;
        const totalH = ghostRows * node.panelHeight + (ghostRows - 1) * node.gapY;
        const geo = new THREE.BoxGeometry(totalW, node.frameDepth, totalH);
        geo.translate(0, node.standoffHeight + node.frameDepth / 2, 0);
        return geo;
    }, [
        node.panelWidth,
        node.panelHeight,
        node.gapX,
        node.gapY,
        node.frameDepth,
        node.standoffHeight,
    ]);
    useEffect(() => {
        useScene.temporal.getState().pause();
        const original = {
            position: [...node.position],
            rotation: node.rotation ?? 0,
            roofSegmentId: node.roofSegmentId,
            parentId: node.parentId,
            metadata: node.metadata,
        };
        const meta = typeof node.metadata === 'object' && node.metadata !== null
            ? node.metadata
            : {};
        const isNew = !!meta.isNew;
        useScene.getState().updateNode(node.id, {
            metadata: { ...meta, isTransient: true },
        });
        const panelObj = sceneRegistry.nodes.get(node.id);
        if (panelObj)
            panelObj.visible = false;
        let lastSnapX = 0;
        let lastSnapZ = 0;
        let lastTarget = null;
        const roofDrag = createRelativeRoofDrag(original);
        const updateGhost = (event) => {
            const target = roofDrag.resolve(event);
            if (!target)
                return;
            lastTarget = target;
            const sx = Math.round(target.localX * 20) / 20;
            const sz = Math.round(target.localZ * 20) / 20;
            if (sx !== lastSnapX || sz !== lastSnapZ) {
                triggerSFX('sfx:grid-snap');
                lastSnapX = sx;
                lastSnapZ = sz;
            }
            // Use the same analytical approach as the placement tool so the
            // ghost orientation matches the committed panel exactly regardless
            // of segment rotation. The placement tool's ghost is always correct
            // because analytical normals are computed in segment-local space
            // and the yaw is applied explicitly, avoiding any world-vs-local
            // normal mismatch.
            const segLocalNormal = getAnalyticalNormal(target.localX, target.localZ, target.segment);
            setPreviewSurfaceQuat(surfaceQuatFromNormal(segLocalNormal, new THREE.Quaternion()));
            setPreviewYaw((event.node.rotation ?? 0) + (target.segment.rotation ?? 0));
            setPreviewPos(roofSegmentLocalToBuildingLocal(target.segment.id, [
                target.localX,
                target.localY,
                target.localZ,
            ]));
            setHasHit(true);
            event.stopPropagation();
        };
        const onRoofClick = (event) => {
            const st = useScene.getState();
            const target = lastTarget ?? roofDrag.resolve(event);
            if (!target)
                return;
            const targetSegmentId = target.segment.id;
            // Compute segment-local normal for the committed node so the
            // renderer's surfaceQuat + outer segment.rotation compose to
            // the same world orientation the ghost showed.
            const segLocalNormal = getAnalyticalNormal(target.localX, target.localZ, target.segment);
            st.updateNode(node.id, {
                position: original.position,
                rotation: original.rotation,
                roofSegmentId: original.roofSegmentId,
                parentId: original.parentId,
                metadata: original.metadata,
            });
            useScene.temporal.getState().resume();
            st.updateNode(node.id, {
                roofSegmentId: targetSegmentId,
                parentId: targetSegmentId,
                position: [target.localX, target.localY, target.localZ],
                rotation: original.rotation,
                // Segment-local normal — must stay consistent with getAnalyticalNormal
                // semantics so the renderer's surfaceQuat is in the correct frame.
                surfaceNormal: [segLocalNormal.x, segLocalNormal.y, segLocalNormal.z],
                visible: true,
                metadata: {},
            });
            if (original.roofSegmentId && original.roofSegmentId !== targetSegmentId) {
                const oldSeg = st.nodes[original.roofSegmentId];
                if (oldSeg) {
                    st.updateNode(original.roofSegmentId, {
                        children: (oldSeg.children ?? []).filter((id) => id !== node.id),
                    });
                }
                const newSeg = st.nodes[targetSegmentId];
                if (newSeg && !(newSeg.children ?? []).includes(node.id)) {
                    st.updateNode(targetSegmentId, {
                        children: [...(newSeg.children ?? []), node.id],
                    });
                }
                st.dirtyNodes.add(original.roofSegmentId);
            }
            st.dirtyNodes.add(targetSegmentId);
            st.dirtyNodes.add(node.id);
            useScene.temporal.getState().pause();
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            triggerSFX('sfx:item-place');
            exitMoveMode();
            event.stopPropagation();
        };
        const onCancel = () => {
            if (isNew) {
                useScene.temporal.getState().resume();
                const parentId = original.roofSegmentId;
                if (parentId) {
                    const parent = useScene.getState().nodes[parentId];
                    if (parent) {
                        useScene.getState().updateNode(parentId, {
                            children: (parent.children ?? []).filter((id) => id !== node.id),
                        });
                    }
                }
                useScene.getState().deleteNode(node.id);
                markToolCancelConsumed();
                exitMoveMode();
                return;
            }
            useScene.getState().updateNode(node.id, {
                position: original.position,
                rotation: original.rotation,
                roofSegmentId: original.roofSegmentId,
                parentId: original.parentId,
                metadata: original.metadata,
            });
            if (original.roofSegmentId) {
                useScene.getState().dirtyNodes.add(original.roofSegmentId);
            }
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            useScene.temporal.getState().resume();
            markToolCancelConsumed();
            exitMoveMode();
        };
        emitter.on('roof:move', updateGhost);
        emitter.on('roof:enter', updateGhost);
        emitter.on('roof:click', onRoofClick);
        emitter.on('tool:cancel', onCancel);
        return () => {
            emitter.off('roof:move', updateGhost);
            emitter.off('roof:enter', updateGhost);
            emitter.off('roof:click', onRoofClick);
            emitter.off('tool:cancel', onCancel);
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            useScene.temporal.getState().resume();
        };
    }, [exitMoveMode, node]);
    // Ghost layout mirrors the placement tool exactly:
    //   position (building-local hit point)
    //   → rotation-y (roof.rotation + segment.rotation — explicit yaw)
    //   → quaternion (segment-local surface tilt)
    // This is identical to the placement ghost so drag and commit always
    // show the same orientation.
    return (_jsx("group", { position: previewPos, ref: previewRef, visible: hasHit, children: _jsx("group", { "rotation-y": previewYaw, children: _jsx("group", { quaternion: previewSurfaceQuat, children: _jsx("mesh", { geometry: previewGeo, layers: EDITOR_LAYER, material: previewMaterial }) }) }) }));
}
