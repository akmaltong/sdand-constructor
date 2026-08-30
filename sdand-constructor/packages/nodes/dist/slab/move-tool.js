'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { collectAlignmentAnchors, emitter, polygonAnchors, sceneRegistry, useLiveTransforms, useScene, } from '@pascal-app/core';
import { CursorSphere, getSegmentGridStep, markToolCancelConsumed, resolveAlignmentForActiveBuilding, snapBuildingLocalToWorldGrid, snapFenceDraftPoint, triggerSFX, useAlignmentGuides, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Phase 5 Stage D — slab whole-move tool.
 *
 * Live-drag pattern: translate the slab MESH visually via
 * `sceneRegistry.nodes.get(id).position` + a mirror entry in
 * `useLiveTransforms`. No `scene.update` during the drag — the slab's
 * polygon CSG isn't rebuilt per tick. On commit we write the
 * translated polygon to the scene exactly once and clear the
 * useLiveTransforms entry. `GeometrySystem` resets `mesh.position` to
 * (0,0,0) when it rebuilds, so the visual transitions smoothly with
 * no teleport.
 *
 * History stays UNPAUSED during the drag: the scene state isn't
 * changing (we're only mutating Three.js mesh transforms), so there's
 * nothing for zundo to record. The single `scene.update` on commit
 * becomes the single undo step naturally.
 */
/** Figma-style alignment-snap threshold (meters), matching the other tools. */
const ALIGNMENT_THRESHOLD_M = 0.08;
function translatePolygon(polygon, deltaX, deltaZ) {
    return polygon.map(([x, z]) => [x + deltaX, z + deltaZ]);
}
function getPolygonCenter(polygon) {
    if (polygon.length === 0)
        return [0, 0];
    let sumX = 0;
    let sumZ = 0;
    for (const [x, z] of polygon) {
        sumX += x;
        sumZ += z;
    }
    return [sumX / polygon.length, sumZ / polygon.length];
}
function setMeshOffset(id, deltaX, deltaZ) {
    const mesh = sceneRegistry.nodes.get(id);
    if (mesh)
        mesh.position.set(deltaX, 0, deltaZ);
}
/**
 * Distinguish 3D-canvas grid events (which this tool handles) from
 * 2D floor-plan grid events (which `slabFloorplanMoveTarget` +
 * `FloorplanRegistryMoveOverlay` Path 1 handle). The 2D scene wraps
 * everything in `[data-floorplan-scene]`; if the native event's target
 * is inside that subtree, the event belongs to the 2D mover. Without
 * this guard, both paths would write the polygon on commit and produce
 * two history entries / a double-translation.
 */
function isFloorplanSourcedEvent(event) {
    // ThreeEvent (3D) wraps the DOM PointerEvent under `.nativeEvent`;
    // the 2D emitter passes the raw PointerEvent directly. Cover both.
    const native = event.nativeEvent;
    const candidate = native ?? null;
    const target = candidate?.target ??
        candidate?.nativeEvent?.target ??
        null;
    if (!target || typeof target.closest !== 'function')
        return false;
    return target.closest('[data-floorplan-scene]') != null;
}
export const MoveSlabTool = ({ node }) => {
    const activatedAtRef = useRef(Date.now());
    const originalPolygonRef = useRef(node.polygon.map(([x, z]) => [x, z]));
    const originalHolesRef = useRef((node.holes ?? []).map((hole) => hole.map(([x, z]) => [x, z])));
    const originalCenterRef = useRef(getPolygonCenter(originalPolygonRef.current));
    const dragAnchorRef = useRef(null);
    const previousGridPosRef = useRef(null);
    const deltaRef = useRef([0, 0]);
    const [cursorLocalPos, setCursorLocalPos] = useState(() => {
        const c = originalCenterRef.current;
        return [c[0], 0, c[1]];
    });
    const exitMoveMode = useCallback(() => {
        useEditor.getState().setMovingNode(null);
    }, []);
    useEffect(() => {
        const originalPolygon = originalPolygonRef.current;
        const originalHoles = originalHolesRef.current;
        const originalCenter = originalCenterRef.current;
        const slabId = node.id;
        const levelNode = node.parentId && useScene.getState().nodes[node.parentId]?.type === 'level'
            ? useScene.getState().nodes[node.parentId]
            : null;
        const levelChildren = levelNode?.children ?? [];
        const levelWalls = levelChildren
            .map((childId) => useScene.getState().nodes[childId])
            .filter((child) => child?.type === 'wall');
        const levelFences = levelChildren
            .map((childId) => useScene.getState().nodes[childId])
            .filter((child) => child?.type === 'fence');
        // Alignment candidates — every other alignable object's anchors,
        // gathered once (the scene graph is stable during the drag).
        const alignmentCandidates = collectAlignmentAnchors(useScene.getState().nodes, slabId);
        let wasCommitted = false;
        const applyPreview = (deltaX, deltaZ) => {
            deltaRef.current = [deltaX, deltaZ];
            // Visual: translate the slab MESH only. No scene mutation, no
            // polygon rebuild, no React re-render of geometry.
            setMeshOffset(slabId, deltaX, deltaZ);
            // useLiveTransforms holds the same delta the direct mesh.position
            // mutation uses — ParametricNodeRenderer reads it and reconciles
            // `<group position={liveTransform.position}>` via React. Mismatched
            // values here cause the two systems to fight per frame (jitter
            // during drag).
            useLiveTransforms.getState().set(slabId, {
                position: [deltaX, 0, deltaZ],
                rotation: 0,
            });
            // Cursor sphere follows the new polygon center (independent of
            // group position).
            setCursorLocalPos([originalCenter[0] + deltaX, 0, originalCenter[1] + deltaZ]);
        };
        const clearPreview = () => {
            setMeshOffset(slabId, 0, 0);
            useLiveTransforms.getState().clear(slabId);
        };
        const onGridMove = (event) => {
            if (isFloorplanSourcedEvent(event))
                return;
            const gridStep = getSegmentGridStep();
            const [localX, localZ] = snapFenceDraftPoint({
                point: [event.localPosition[0], event.localPosition[2]],
                walls: levelWalls,
                fences: levelFences,
                gridSnap: (p) => snapBuildingLocalToWorldGrid(p, gridStep),
            });
            if (previousGridPosRef.current &&
                (localX !== previousGridPosRef.current[0] || localZ !== previousGridPosRef.current[1])) {
                triggerSFX('sfx:grid-snap');
            }
            previousGridPosRef.current = [localX, localZ];
            const anchor = dragAnchorRef.current ?? [localX, localZ];
            dragAnchorRef.current = anchor;
            let deltaX = localX - anchor[0];
            let deltaZ = localZ - anchor[1];
            // Figma-style alignment snap: align the slab's translated polygon
            // vertices to other objects' anchors; fold the snap into the delta and
            // publish a guide. Alt bypasses.
            const bypass = event.nativeEvent?.altKey === true;
            if (!bypass && alignmentCandidates.length > 0) {
                const result = resolveAlignmentForActiveBuilding({
                    moving: polygonAnchors(slabId, translatePolygon(originalPolygon, deltaX, deltaZ)),
                    candidates: alignmentCandidates,
                    threshold: ALIGNMENT_THRESHOLD_M,
                });
                if (result.snap) {
                    deltaX += result.snap.dx;
                    deltaZ += result.snap.dz;
                }
                useAlignmentGuides.getState().set(result.guides);
            }
            else {
                useAlignmentGuides.getState().clear();
            }
            applyPreview(deltaX, deltaZ);
        };
        const onGridClick = (event) => {
            if (isFloorplanSourcedEvent(event))
                return;
            if (Date.now() - activatedAtRef.current < 150) {
                event.nativeEvent?.stopPropagation?.();
                return;
            }
            const [deltaX, deltaZ] = deltaRef.current;
            wasCommitted = true;
            if (deltaX !== 0 || deltaZ !== 0) {
                // Single scene.update — recorded as one undo step (history was
                // never paused). GeometrySystem rebuilds polygon-driven geometry
                // and resets the group's transform on the next frame.
                useScene.getState().updateNode(slabId, {
                    polygon: translatePolygon(originalPolygon, deltaX, deltaZ),
                    holes: originalHoles.map((h) => translatePolygon(h, deltaX, deltaZ)),
                });
                useScene.getState().markDirty(slabId);
            }
            // Clear useLiveTransforms but leave mesh.position as-is. The
            // GeometrySystem rebuild zeros it on the next frame, by which
            // point the new geometry is in place — visual stays smooth.
            useLiveTransforms.getState().clear(slabId);
            useAlignmentGuides.getState().clear();
            triggerSFX('sfx:item-place');
            useViewer.getState().setSelection({ selectedIds: [slabId] });
            exitMoveMode();
            event.nativeEvent?.stopPropagation?.();
        };
        const onCancel = () => {
            // No scene state to roll back — we never wrote anything. Just
            // restore the mesh visual.
            clearPreview();
            useAlignmentGuides.getState().clear();
            useViewer.getState().setSelection({ selectedIds: [slabId] });
            markToolCancelConsumed();
            exitMoveMode();
        };
        emitter.on('grid:move', onGridMove);
        emitter.on('grid:click', onGridClick);
        emitter.on('tool:cancel', onCancel);
        return () => {
            useAlignmentGuides.getState().clear();
            if (!wasCommitted) {
                clearPreview();
            }
            else {
                useLiveTransforms.getState().clear(slabId);
            }
            emitter.off('grid:move', onGridMove);
            emitter.off('grid:click', onGridClick);
            emitter.off('tool:cancel', onCancel);
        };
    }, [exitMoveMode, node.id, node.parentId]);
    return (_jsx("group", { children: _jsx(CursorSphere, { position: cursorLocalPos, showTooltip: false }) }));
};
export default MoveSlabTool;
