'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, sceneRegistry, useScene, } from '@pascal-app/core';
import { markToolCancelConsumed, triggerSFX, useEditor } from '@pascal-app/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createRelativeRoofDrag, roofSegmentLocalToBuildingLocal, } from '../shared/relative-roof-drag';
import { getAnalyticalNormal, surfaceQuatFromNormal } from '../shared/roof-surface';
import SkylightPreview from './preview';
export default function MoveSkylightTool({ node }) {
    const exitMoveMode = useCallback(() => {
        useEditor.getState().setMovingNode(null);
    }, []);
    const previewRef = useRef(null);
    const [previewPos, setPreviewPos] = useState([0, 0, 0]);
    // Mirror the placement tool's transform stack so the ghost reads the
    // same in both flows: outer rotation-y aligns the segment's world yaw
    // (roof + segment), inner quaternion tilts to the segment surface in
    // segment-local space (analytical, not raycast — raycast normals can
    // be flipped or in the wrong frame depending on hit-object state).
    // The skylight's own `rotation` is applied on a deeper group so it
    // stays editable on top of the surface alignment.
    const [previewYaw, setPreviewYaw] = useState(0);
    const [previewSurfaceQuat, setPreviewSurfaceQuat] = useState(null);
    const [hasHit, setHasHit] = useState(false);
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
        const skylightObj = sceneRegistry.nodes.get(node.id);
        if (skylightObj)
            skylightObj.visible = false;
        let lastSnapX = 0;
        let lastSnapZ = 0;
        let lastTarget = null;
        const roofDrag = createRelativeRoofDrag(original);
        // Resolve which segment the cursor is over, then derive the same
        // preview transform stack the placement tool uses (`skylight/tool.tsx`):
        // analytical surface normal in segment-local frame → outer yaw =
        // roof + segment rotation. Falls back to leaving the preview hidden
        // if the cursor is between segments — the placement tool does the
        // same via its `if (!hit) return` guard.
        const updateFromHit = (event) => {
            const roof = event.node;
            const target = roofDrag.resolve(event);
            if (!target) {
                setHasHit(false);
                return false;
            }
            lastTarget = target;
            const normal = getAnalyticalNormal(target.localX, target.localZ, target.segment);
            setPreviewSurfaceQuat(surfaceQuatFromNormal(normal, new THREE.Quaternion()));
            setPreviewYaw((roof.rotation ?? 0) + (target.segment.rotation ?? 0));
            setPreviewPos(roofSegmentLocalToBuildingLocal(target.segment.id, [
                target.localX,
                target.localY,
                target.localZ,
            ]));
            setHasHit(true);
            return true;
        };
        const onRoofMove = (event) => {
            const sx = Math.round(event.position[0] * 20) / 20;
            const sz = Math.round(event.position[2] * 20) / 20;
            if (sx !== lastSnapX || sz !== lastSnapZ) {
                triggerSFX('sfx:grid-snap');
                lastSnapX = sx;
                lastSnapZ = sz;
            }
            updateFromHit(event);
            event.stopPropagation();
        };
        const onRoofEnter = (event) => {
            updateFromHit(event);
            event.stopPropagation();
        };
        const onRoofClick = (event) => {
            const st = useScene.getState();
            const target = lastTarget ?? roofDrag.resolve(event);
            if (!target)
                return;
            const targetSegmentId = target.segment.id;
            const finalRotation = original.rotation;
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
                rotation: finalRotation,
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
        emitter.on('roof:move', onRoofMove);
        emitter.on('roof:enter', onRoofEnter);
        emitter.on('roof:click', onRoofClick);
        emitter.on('tool:cancel', onCancel);
        return () => {
            emitter.off('roof:move', onRoofMove);
            emitter.off('roof:enter', onRoofEnter);
            emitter.off('roof:click', onRoofClick);
            emitter.off('tool:cancel', onCancel);
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            useScene.temporal.getState().resume();
        };
    }, [exitMoveMode, node]);
    if (!previewSurfaceQuat)
        return null;
    return (_jsx("group", { position: previewPos, ref: previewRef, visible: hasHit, children: _jsx("group", { "rotation-y": previewYaw, children: _jsx("group", { quaternion: previewSurfaceQuat, children: _jsx("group", { "rotation-y": node.rotation ?? 0, children: _jsx(SkylightPreview, { node: node }) }) }) }) }));
}
