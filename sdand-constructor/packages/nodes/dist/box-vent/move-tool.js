'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, sceneRegistry, useScene, } from '@pascal-app/core';
import { markToolCancelConsumed, triggerSFX, useEditor } from '@pascal-app/editor';
import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { createRelativeRoofDrag, roofSegmentLocalToBuildingLocal, } from '../shared/relative-roof-drag';
import { getAnalyticalNormal, surfaceQuatFromNormal } from '../shared/roof-surface';
import BoxVentPreview from './preview';
/**
 * Box-vent move tool. Mirrors the placement tool's cursor behaviour
 * (ghost follows the roof surface; click on a roof commits) but for an
 * already-existing vent: the original mesh is hidden during the drag,
 * the ghost tracks the cursor with the correct slope tilt + segment yaw,
 * and the click updates the node's position + parent segment in one
 * undoable step. Cancel restores the original transform; if the node was
 * freshly cloned (`metadata.isNew`), cancel deletes it instead.
 */
export default function MoveBoxVentTool({ node }) {
    const exitMoveMode = useCallback(() => {
        useEditor.getState().setMovingNode(null);
    }, []);
    const [previewPos, setPreviewPos] = useState(null);
    const [previewSurfaceQuat, setPreviewSurfaceQuat] = useState(null);
    const [previewYaw, setPreviewYaw] = useState(0);
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
        const ventObj = sceneRegistry.nodes.get(node.id);
        if (ventObj)
            ventObj.visible = false;
        let lastSnap = null;
        let lastTarget = null;
        const roofDrag = createRelativeRoofDrag(original);
        const updatePreview = (event) => {
            const target = roofDrag.resolve(event);
            if (!target)
                return;
            lastTarget = target;
            const sx = Math.round(target.localX * 20) / 20;
            const sz = Math.round(target.localZ * 20) / 20;
            if (!lastSnap || lastSnap[0] !== sx || lastSnap[1] !== sz) {
                triggerSFX('sfx:grid-snap');
                lastSnap = [sx, sz];
            }
            const normal = getAnalyticalNormal(target.localX, target.localZ, target.segment);
            setPreviewSurfaceQuat(surfaceQuatFromNormal(normal, new THREE.Quaternion()));
            setPreviewYaw((event.node.rotation ?? 0) + (target.segment.rotation ?? 0));
            setPreviewPos(roofSegmentLocalToBuildingLocal(target.segment.id, [
                target.localX,
                target.localY,
                target.localZ,
            ]));
            event.stopPropagation();
        };
        const onRoofClick = (event) => {
            const target = lastTarget ?? roofDrag.resolve(event);
            if (!target)
                return;
            const targetSegmentId = target.segment.id;
            const st = useScene.getState();
            // Reparent if the cursor landed on a different segment than the
            // node currently belongs to. Mirrors the skylight move flow:
            // remove the node id from the old segment's children, append to
            // the new one, mark both dirty so the merged-roof system rebuilds.
            const prevSegmentId = original.roofSegmentId;
            if (prevSegmentId && prevSegmentId !== targetSegmentId) {
                const oldSeg = st.nodes[prevSegmentId];
                if (oldSeg) {
                    st.updateNode(prevSegmentId, {
                        children: (oldSeg.children ?? []).filter((id) => id !== node.id),
                    });
                }
                const newSeg = st.nodes[targetSegmentId];
                if (newSeg && !(newSeg.children ?? []).includes(node.id)) {
                    st.updateNode(targetSegmentId, {
                        children: [...(newSeg.children ?? []), node.id],
                    });
                }
                st.dirtyNodes.add(prevSegmentId);
            }
            useScene.temporal.getState().resume();
            st.updateNode(node.id, {
                roofSegmentId: targetSegmentId,
                parentId: targetSegmentId,
                position: [target.localX, target.localY, target.localZ],
                rotation: original.rotation,
                visible: true,
                metadata: {},
            });
            useScene.temporal.getState().pause();
            st.dirtyNodes.add(targetSegmentId);
            st.dirtyNodes.add(node.id);
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            triggerSFX('sfx:item-place');
            exitMoveMode();
            event.stopPropagation();
        };
        const onCancel = () => {
            if (isNew) {
                // Freshly-cloned vent — undo the clone entirely on cancel so the
                // user doesn't end up with an orphan they didn't intend to place.
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
                useScene.temporal.getState().resume();
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
        emitter.on('roof:move', updatePreview);
        emitter.on('roof:enter', updatePreview);
        emitter.on('roof:click', onRoofClick);
        emitter.on('tool:cancel', onCancel);
        return () => {
            emitter.off('roof:move', updatePreview);
            emitter.off('roof:enter', updatePreview);
            emitter.off('roof:click', onRoofClick);
            emitter.off('tool:cancel', onCancel);
            // Safety restore — if the tool is unmounted by something other than
            // a commit / cancel path (e.g. tool change, selection wipe), leave
            // the original mesh visible rather than stranded invisible.
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            useScene.temporal.getState().resume();
        };
    }, [exitMoveMode, node]);
    if (!(previewPos && previewSurfaceQuat))
        return null;
    return (_jsx("group", { position: previewPos, children: _jsx("group", { "rotation-y": previewYaw, children: _jsx("group", { quaternion: previewSurfaceQuat, children: _jsx(BoxVentPreview, { node: node }) }) }) }));
}
