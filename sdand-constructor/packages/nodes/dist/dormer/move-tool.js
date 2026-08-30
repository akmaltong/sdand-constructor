'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { DormerNode as DormerNodeSchema, sceneRegistry, useScene, } from '@pascal-app/core';
import { useEditor } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useEffect, useMemo } from 'react';
import DormerPreview from './preview';
import { useDormerPlacement } from './use-dormer-placement';
/**
 * Drag-to-place tool for dormer duplicate / move. Receives the moving
 * node (a clone with `id` stripped + `metadata.isNew = true` after a
 * Duplicate action) via `node` prop, shows the same ghost preview as
 * placement, and on click commits the cloned dormer to the hit segment.
 *
 * On cancel, a duplicate clone is deleted and an existing dormer is
 * restored to its original segment + position. Mounted via
 * `def.affordanceTools.move`.
 */
const MoveDormerTool = ({ node }) => {
    const setSelection = useViewer((s) => s.setSelection);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    // Ghost data — same as the moving clone but pinned to position[0,0,0]
    // (the outer groups place it on the roof). Reparse so Zod fills any
    // defaults missing from the clone.
    const previewNode = useMemo(() => {
        const { id: _id, ...rest } = node;
        return DormerNodeSchema.parse({
            ...rest,
            position: [0, 0, 0],
            rotation: 0,
        });
    }, [node]);
    // Hide the moving dormer while dragging. Restored in cleanup or on
    // commit. We also mark metadata.isTransient so any other consumer
    // (e.g. the inspector) can short-circuit.
    const meta = typeof node.metadata === 'object' && node.metadata !== null
        ? node.metadata
        : {};
    const isNew = !!meta.isNew;
    const originalRotation = node.rotation ?? 0;
    const originalMetadata = node.metadata;
    // biome-ignore lint/correctness/useExhaustiveDependencies: capture-on-mount; meta is intentionally not re-read on changes.
    useEffect(() => {
        if (!isNew) {
            useScene.getState().updateNode(node.id, {
                metadata: { ...meta, isTransient: true },
            });
        }
        const dormerObj = sceneRegistry.nodes.get(node.id);
        const prevVisible = dormerObj?.visible;
        if (dormerObj)
            dormerObj.visible = false;
        return () => {
            // Restore visibility + metadata if the move was cancelled.
            const obj = sceneRegistry.nodes.get(node.id);
            if (obj)
                obj.visible = prevVisible ?? true;
            if (!isNew) {
                useScene.getState().updateNode(node.id, {
                    metadata: originalMetadata,
                });
            }
        };
    }, [node.id, isNew]);
    const { activeBuildingId, segmentXform, hitLocal, ghostRotation } = useDormerPlacement({
        initialRotation: originalRotation,
        relativeStart: {
            position: [...node.position],
            roofSegmentId: node.roofSegmentId,
        },
        onCommit: (hit, rotation) => {
            const state = useScene.getState();
            // Strip the `isNew` / `isTransient` flags — only used to mark a
            // clone or in-flight move that hasn't been committed yet.
            const cleanedMeta = (() => {
                const m = node.metadata && typeof node.metadata === 'object' && !Array.isArray(node.metadata)
                    ? node.metadata
                    : {};
                const { isNew: _isNew, isTransient: _isTransient, ...rest } = m;
                return Object.keys(rest).length > 0 ? rest : undefined;
            })();
            if (isNew || !node.id) {
                const { id: _id, ...rest } = node;
                const committed = DormerNodeSchema.parse({
                    ...rest,
                    roofSegmentId: hit.segment.id,
                    parentId: hit.segment.id,
                    position: [hit.localX, hit.localY, hit.localZ],
                    rotation,
                    metadata: cleanedMeta,
                });
                state.createNode(committed, hit.segment.id);
                state.dirtyNodes.add(hit.segment.id);
                setSelection({ selectedIds: [committed.id] });
            }
            else {
                const prevSegmentId = node.roofSegmentId;
                state.updateNode(node.id, {
                    roofSegmentId: hit.segment.id,
                    parentId: hit.segment.id,
                    position: [hit.localX, hit.localY, hit.localZ],
                    rotation,
                    metadata: cleanedMeta,
                });
                if (prevSegmentId)
                    state.dirtyNodes.add(prevSegmentId);
                state.dirtyNodes.add(hit.segment.id);
                // Unlist from previous segment's children and add to the new one.
                if (prevSegmentId && prevSegmentId !== hit.segment.id) {
                    const prevSeg = state.nodes[prevSegmentId];
                    if (prevSeg) {
                        state.updateNode(prevSegmentId, {
                            children: (prevSeg.children ?? []).filter((id) => id !== node.id),
                        });
                    }
                    const newSeg = state.nodes[hit.segment.id];
                    if (newSeg && !(newSeg.children ?? []).includes(node.id)) {
                        state.updateNode(hit.segment.id, {
                            children: [...(newSeg.children ?? []), node.id],
                        });
                    }
                }
                setSelection({ selectedIds: [node.id] });
            }
            const dormerObj = sceneRegistry.nodes.get(node.id);
            if (dormerObj)
                dormerObj.visible = true;
            setMovingNode(null);
        },
    });
    if (!activeBuildingId || !segmentXform || !hitLocal)
        return null;
    return (_jsx("group", { position: segmentXform.position, quaternion: segmentXform.quaternion, children: _jsx("group", { position: hitLocal, children: _jsx("group", { "rotation-y": ghostRotation, children: _jsx(DormerPreview, { node: previewNode }) }) }) }));
};
export default MoveDormerTool;
