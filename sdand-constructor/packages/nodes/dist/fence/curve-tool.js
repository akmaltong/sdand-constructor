'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, getClampedWallCurveOffset, getMaxWallCurveOffset, getWallChordFrame, getWallMidpointHandlePoint, normalizeWallCurveOffset, pauseSceneHistory, resumeSceneHistory, useScene, } from '@pascal-app/core';
import { CursorSphere, getSegmentGridStep, markToolCancelConsumed, snapScalarToGrid, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Phase 5 Stage D — fence curve tool (kind-owned).
 *
 * 1:1 port of the legacy `CurveFenceTool` (editor/components/tools/
 * fence/curve-fence-tool.tsx). Same snap pipeline, same Shift override,
 * same history dance, same activation grace. Imports adjusted to the
 * `@pascal-app/editor` public surface (triggerSFX, markToolCancelConsumed,
 * getSegmentGridStep, snapScalarToGrid). Mounted via
 * `def.affordanceTools.curve` — ToolManager picks it up at runtime,
 * legacy fallback is unused when this kind is registered.
 */
export const CurveFenceTool = ({ node }) => {
    const activatedAtRef = useRef(Date.now());
    const originalCurveOffsetRef = useRef(getClampedWallCurveOffset(node));
    const previousCurveOffsetRef = useRef(null);
    const shiftPressedRef = useRef(false);
    const previewOffsetRef = useRef(originalCurveOffsetRef.current);
    const initialHandle = getWallMidpointHandlePoint(node);
    const [cursorLocalPos, setCursorLocalPos] = useState([
        initialHandle.x,
        0,
        initialHandle.y,
    ]);
    const exitCurveMode = useCallback(() => {
        useEditor.getState().setCurvingFence(null);
    }, []);
    useEffect(() => {
        const nodeId = node.id;
        const originalCurveOffset = originalCurveOffsetRef.current;
        const chord = getWallChordFrame(node);
        const maxCurveOffset = getMaxWallCurveOffset(node);
        pauseSceneHistory(useScene);
        let wasCommitted = false;
        const applyPreview = (curveOffset) => {
            if (previewOffsetRef.current === curveOffset) {
                return;
            }
            previewOffsetRef.current = curveOffset;
            const nextNode = {
                ...node,
                curveOffset,
            };
            const handlePoint = getWallMidpointHandlePoint(nextNode);
            setCursorLocalPos([handlePoint.x, 0, handlePoint.y]);
            useScene.getState().updateNode(nodeId, { curveOffset });
            useScene.getState().markDirty(nodeId);
        };
        const restoreOriginal = () => {
            if (previewOffsetRef.current === originalCurveOffset) {
                return;
            }
            previewOffsetRef.current = originalCurveOffset;
            useScene.getState().updateNode(nodeId, { curveOffset: originalCurveOffset });
            useScene.getState().markDirty(nodeId);
        };
        const onGridMove = (event) => {
            const snapStep = getSegmentGridStep();
            const localX = shiftPressedRef.current
                ? event.localPosition[0]
                : snapScalarToGrid(event.localPosition[0], snapStep);
            const localZ = shiftPressedRef.current
                ? event.localPosition[2]
                : snapScalarToGrid(event.localPosition[2], snapStep);
            const offsetFromMidpoint = -((localX - chord.midpoint.x) * chord.normal.x +
                (localZ - chord.midpoint.y) * chord.normal.y);
            const snappedOffset = shiftPressedRef.current
                ? offsetFromMidpoint
                : snapScalarToGrid(offsetFromMidpoint, snapStep);
            const nextCurveOffset = normalizeWallCurveOffset(node, Math.max(-maxCurveOffset, Math.min(maxCurveOffset, snappedOffset)));
            if (previousCurveOffsetRef.current !== null &&
                nextCurveOffset !== previousCurveOffsetRef.current) {
                triggerSFX('sfx:grid-snap');
            }
            previousCurveOffsetRef.current = nextCurveOffset;
            applyPreview(nextCurveOffset);
        };
        const onGridClick = (event) => {
            if (Date.now() - activatedAtRef.current < 150) {
                event.nativeEvent?.stopPropagation?.();
                return;
            }
            const curveOffset = previewOffsetRef.current;
            wasCommitted = true;
            if (curveOffset !== originalCurveOffset) {
                // Restore original baseline while paused so the next resume+update
                // registers as a single tracked change (undo reverts to original).
                useScene.getState().updateNode(nodeId, { curveOffset: originalCurveOffset });
                useScene.getState().markDirty(nodeId);
                resumeSceneHistory(useScene);
                useScene.getState().updateNode(nodeId, { curveOffset });
                useScene.getState().markDirty(nodeId);
                pauseSceneHistory(useScene);
            }
            triggerSFX('sfx:item-place');
            useViewer.getState().setSelection({ selectedIds: [nodeId] });
            exitCurveMode();
            event.nativeEvent?.stopPropagation?.();
        };
        const onCancel = () => {
            restoreOriginal();
            useViewer.getState().setSelection({ selectedIds: [nodeId] });
            resumeSceneHistory(useScene);
            markToolCancelConsumed();
            exitCurveMode();
        };
        const onKeyDown = (event) => {
            if (event.key === 'Shift') {
                shiftPressedRef.current = true;
            }
        };
        const onKeyUp = (event) => {
            if (event.key === 'Shift') {
                shiftPressedRef.current = false;
            }
        };
        emitter.on('grid:move', onGridMove);
        emitter.on('grid:click', onGridClick);
        emitter.on('tool:cancel', onCancel);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            if (!wasCommitted) {
                restoreOriginal();
            }
            resumeSceneHistory(useScene);
            emitter.off('grid:move', onGridMove);
            emitter.off('grid:click', onGridClick);
            emitter.off('tool:cancel', onCancel);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [exitCurveMode, node]);
    return (_jsx("group", { children: _jsx(CursorSphere, { position: cursorLocalPos, showTooltip: false }) }));
};
export default CurveFenceTool;
