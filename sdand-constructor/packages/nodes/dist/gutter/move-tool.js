'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, sceneRegistry, useScene, } from '@pascal-app/core';
import { markToolCancelConsumed, triggerSFX, useEditor } from '@pascal-app/editor';
import { useCallback, useEffect, useState } from 'react';
import { createRelativeRoofDrag } from '../shared/relative-roof-drag';
import { resolveEaveSnap } from './eave-snap';
import GutterPreview from './preview';
/**
 * Gutter move tool. Mirrors the ridge-vent move flow — ghost follows
 * the cursor over any roof segment, click commits the new position +
 * parent segment in one undoable step. The eave-snap math from the
 * placement tool runs again on the new segment so the gutter lands on
 * the correct side of the new ridge.
 *
 * On commit the gutter rotation may flip from 0 ↔ π if the user moves
 * it from the front eave to the back eave (or vice versa). The
 * pre-drag rotation is restored on cancel.
 *
 * Ghost transform: mirrors the GutterRenderer chain (roof → segment →
 * snap), so the cursor preview lands at the exact world coords the
 * commit will store. GutterPreview applies no internal rotation, so
 * the gutter's CURRENT `rotation` doesn't bleed into the new snap.
 */
export default function MoveGutterTool({ node }) {
    const exitMoveMode = useCallback(() => {
        useEditor.getState().setMovingNode(null);
    }, []);
    const [target, setTarget] = useState(null);
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
        const gutterObj = sceneRegistry.nodes.get(node.id);
        if (gutterObj)
            gutterObj.visible = false;
        let lastSnap = null;
        let lastTarget = null;
        const roofDrag = createRelativeRoofDrag(original);
        const resolveTarget = (event) => {
            const target = roofDrag.resolve(event);
            if (!target)
                return null;
            return {
                segment: target.segment,
                snap: resolveEaveSnap(target.segment, target.localX, target.localZ),
            };
        };
        const updatePreview = (event) => {
            const roof = event.node;
            const target = resolveTarget(event);
            if (!target)
                return;
            lastTarget = target;
            // Same snap math as the placement tool — picking-up and putting-
            // down round-trip identically. roofType-aware: hip/flat picks
            // ±X or ±Z based on which slope the cursor is on; shed always
            // snaps to its low (+Z) eave; gable / gambrel / mansard / dutch
            // stay on ±Z.
            const { snap } = target;
            const sx = Math.round(snap.eaveX * 20) / 20;
            const sz = Math.round(snap.eaveZ * 20) / 20;
            if (!lastSnap || lastSnap[0] !== sx || lastSnap[1] !== sz) {
                triggerSFX('sfx:grid-snap');
                lastSnap = [sx, sz];
            }
            setTarget({
                roof: {
                    position: (roof.position ?? [0, 0, 0]),
                    rotation: roof.rotation ?? 0,
                },
                segment: {
                    position: (target.segment.position ?? [0, 0, 0]),
                    rotation: target.segment.rotation ?? 0,
                },
                snap,
            });
            event.stopPropagation();
        };
        const onRoofClick = (event) => {
            const target = lastTarget ?? resolveTarget(event);
            if (!target)
                return;
            const targetSegmentId = target.segment.id;
            const { snap } = target;
            const st = useScene.getState();
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
                position: [snap.eaveX, snap.eaveY, snap.eaveZ],
                rotation: snap.rotation,
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
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = true;
            useScene.temporal.getState().resume();
        };
    }, [exitMoveMode, node]);
    if (!target)
        return null;
    return (_jsx("group", { position: target.roof.position, "rotation-y": target.roof.rotation, children: _jsx("group", { position: target.segment.position, "rotation-y": target.segment.rotation, children: _jsx("group", { position: [target.snap.eaveX, target.snap.eaveY, target.snap.eaveZ], "rotation-y": target.snap.rotation, children: _jsx(GutterPreview, { node: node }) }) }) }));
}
