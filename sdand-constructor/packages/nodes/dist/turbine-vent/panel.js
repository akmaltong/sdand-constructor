'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getActiveRoofHeight, TurbineVentNode as TurbineVentSchema, useLiveNodeOverrides, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, PanelSection, PanelWrapper, SegmentedControl, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Move, Pause, Play, Trash2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
// Speed restored when resuming a paused turbine that has no remembered
// speed yet (matches the schema default).
const DEFAULT_SPIN_SPEED = 0.8;
/**
 * Inspector panel for a placed turbine vent. Exposes style + dimensions +
 * spin speed plus Move / Duplicate / Delete wired into the same
 * ghost-preview drag flow the placement tool uses (see `./move-tool.tsx`).
 * Mirrors the box-vent panel.
 */
export default function TurbineVentPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const deleteNode = useScene((s) => s.deleteNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const storeNode = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    const overrides = useLiveNodeOverrides((s) => selectedId
        ? s.get(selectedId)
        : undefined);
    const node = storeNode && overrides ? { ...storeNode, ...overrides } : storeNode;
    const segment = useScene((s) => node?.roofSegmentId
        ? s.nodes[node.roofSegmentId]
        : undefined);
    const previewProp = useCallback((updates) => {
        if (!selectedId)
            return;
        useLiveNodeOverrides.getState().set(selectedId, updates);
    }, [selectedId]);
    const commitProp = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
        useLiveNodeOverrides.getState().clear(selectedId);
    }, [selectedId, updateNode]);
    const handleUpdate = commitProp;
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleBack = useCallback(() => {
        if (node?.roofSegmentId) {
            setSelection({ selectedIds: [node.roofSegmentId] });
        }
    }, [node?.roofSegmentId, setSelection]);
    const handleMove = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        setMovingNode(node);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        const parentId = node.roofSegmentId;
        if (!parentId)
            return;
        const state = useScene.getState();
        const meta = typeof node.metadata === 'object' && node.metadata !== null
            ? node.metadata
            : {};
        const cloneInput = {
            ...node,
            id: undefined,
            metadata: { ...meta, isNew: true },
        };
        const cloned = TurbineVentSchema.parse(cloneInput);
        state.createNode(cloned, parentId);
        state.dirtyNodes.add(parentId);
        setMovingNode(cloned);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    const handleDelete = useCallback(() => {
        if (!(selectedId && node))
            return;
        triggerSFX('sfx:item-delete');
        const segmentId = node.roofSegmentId;
        if (segmentId) {
            const state = useScene.getState();
            const seg = state.nodes[segmentId];
            if (seg) {
                state.updateNode(segmentId, {
                    children: (seg.children ?? []).filter((id) => id !== selectedId),
                });
            }
        }
        deleteNode(selectedId);
        if (segmentId) {
            useScene.getState().dirtyNodes.add(segmentId);
            setSelection({ selectedIds: [segmentId] });
        }
        else {
            setSelection({ selectedIds: [] });
        }
    }, [selectedId, node, deleteNode, setSelection]);
    // Play / pause the idle spin. Pausing remembers the current speed so
    // Play restores it (falling back to the default if it was never running).
    const lastSpeedRef = useRef(DEFAULT_SPIN_SPEED);
    const isSpinning = (node?.spinSpeed ?? 0) > 0;
    const handleToggleSpin = useCallback(() => {
        if (!node)
            return;
        const current = node.spinSpeed ?? 0;
        if (current > 0) {
            lastSpeedRef.current = current;
            handleUpdate({ spinSpeed: 0 });
        }
        else {
            handleUpdate({
                spinSpeed: lastSpeedRef.current > 0 ? lastSpeedRef.current : DEFAULT_SPIN_SPEED,
            });
        }
    }, [node, handleUpdate]);
    if (!(node && node.type === 'turbine-vent' && selectedId))
        return null;
    return (_jsxs(PanelWrapper, { icon: "/icons/roof.png", onBack: node.roofSegmentId ? handleBack : undefined, onClose: handleClose, title: node.name || 'Turbine Vent', width: 300, children: [_jsx(PanelSection, { title: "Style", children: _jsx(SegmentedControl, { onChange: (v) => handleUpdate({ style: v }), options: [
                        { label: 'Globe', value: 'globe' },
                        { label: 'Cylinder', value: 'cylinder' },
                    ], value: node.style ?? 'globe' }) }), _jsxs(PanelSection, { title: "Dimensions", children: [_jsx(SliderControl, { label: "Diameter", max: 0.7, min: 0.15, onChange: (v) => previewProp({ diameter: v }), onCommit: (v) => handleUpdate({ diameter: v }), precision: 2, restoreOnCommit: false, step: 0.01, unit: "m", value: Math.round(node.diameter * 100) / 100 }), _jsx(SliderControl, { label: "Height", max: 0.9, min: 0.2, onChange: (v) => previewProp({ height: v }), onCommit: (v) => handleUpdate({ height: v }), precision: 2, restoreOnCommit: false, step: 0.01, unit: "m", value: Math.round(node.height * 100) / 100 }), _jsx(SliderControl, { label: "Neck Height", max: Math.max(0.04, node.height * 0.5), min: 0.02, onChange: (v) => previewProp({ neckHeight: v }), onCommit: (v) => handleUpdate({ neckHeight: v }), precision: 2, restoreOnCommit: false, step: 0.01, unit: "m", value: Math.round((node.neckHeight ?? 0.09) * 100) / 100 }), _jsx(SliderControl, { label: "Vanes", max: 36, min: 6, onChange: (v) => previewProp({ vaneCount: Math.round(v) }), onCommit: (v) => handleUpdate({ vaneCount: Math.round(v) }), precision: 0, restoreOnCommit: false, step: 1, unit: "", value: Math.round(node.vaneCount ?? 20) })] }), _jsxs(PanelSection, { title: "Motion", children: [_jsx(ActionGroup, { children: _jsx(ActionButton, { icon: isSpinning ? _jsx(Pause, { className: "h-3.5 w-3.5" }) : _jsx(Play, { className: "h-3.5 w-3.5" }), label: isSpinning ? 'Pause' : 'Play', onClick: handleToggleSpin }) }), _jsx(SliderControl, { label: "Spin Speed", max: 4, min: 0, onChange: (v) => previewProp({ spinSpeed: v }), onCommit: (v) => handleUpdate({ spinSpeed: v }), precision: 1, restoreOnCommit: false, step: 0.1, unit: "rad/s", value: Math.round((node.spinSpeed ?? 0) * 10) / 10 })] }), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: "X", max: Math.round(((segment?.width ?? 10) / 2) * 100) / 100, min: -Math.round(((segment?.width ?? 10) / 2) * 100) / 100, onChange: (v) => previewProp({ position: [v, node.position[1] ?? 0, node.position[2] ?? 0] }), onCommit: (v) => handleUpdate({ position: [v, node.position[1] ?? 0, node.position[2] ?? 0] }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round((node.position[0] ?? 0) * 100) / 100 }), _jsx(SliderControl, { label: "Y", max: Math.max((segment?.wallHeight ?? 3) + (segment ? getActiveRoofHeight(segment) : 3) + 2, (node.position[1] ?? 0) + 0.1), min: Math.min(0, (node.position[1] ?? 0) - 0.5), onChange: (v) => previewProp({ position: [node.position[0] ?? 0, v, node.position[2] ?? 0] }), onCommit: (v) => handleUpdate({ position: [node.position[0] ?? 0, v, node.position[2] ?? 0] }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round((node.position[1] ?? 0) * 100) / 100 }), _jsx(SliderControl, { label: "Z", max: Math.round(((segment?.depth ?? 10) / 2) * 100) / 100, min: -Math.round(((segment?.depth ?? 10) / 2) * 100) / 100, onChange: (v) => previewProp({ position: [node.position[0] ?? 0, node.position[1] ?? 0, v] }), onCommit: (v) => handleUpdate({ position: [node.position[0] ?? 0, node.position[1] ?? 0, v] }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round((node.position[2] ?? 0) * 100) / 100 }), _jsx(SliderControl, { label: "Rotation", max: 180, min: -180, onChange: (deg) => previewProp({ rotation: (deg * Math.PI) / 180 }), onCommit: (deg) => handleUpdate({ rotation: (deg * Math.PI) / 180 }), precision: 0, restoreOnCommit: false, step: 1, unit: "\u00B0", value: Math.round(((node.rotation ?? 0) * 180) / Math.PI) })] }), _jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: handleDelete })] }) })] }));
}
