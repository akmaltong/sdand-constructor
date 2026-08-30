'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLiveNodeOverrides, useScene, } from '@pascal-app/core';
import { cn, PanelSection, PanelWrapper, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useCallback, useState } from 'react';
import { DormerActionsSection } from './panel-actions-section';
import { DormerPositionSection } from './panel-position-section';
import { DormerWindowSection } from './panel-window-section';
const ROOF_TYPE_OPTIONS = [
    { label: 'Gable', value: 'gable' },
    { label: 'Hip', value: 'hip' },
    { label: 'Shed', value: 'shed' },
    { label: 'Gambrel', value: 'gambrel' },
    { label: 'Dutch', value: 'dutch' },
    { label: 'Mansard', value: 'mansard' },
    { label: 'Flat', value: 'flat' },
];
const SECTION_OPTIONS = [
    { label: 'Dormer', value: 'dormer' },
    { label: 'Window', value: 'window' },
];
export default function DormerPanel() {
    const [section, setSection] = useState('dormer');
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const deleteNode = useScene((s) => s.deleteNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const storeNode = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    const overrides = useLiveNodeOverrides((s) => selectedId ? s.get(selectedId) : undefined);
    const node = storeNode && overrides ? { ...storeNode, ...overrides } : storeNode;
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
    }, [selectedId, updateNode]);
    // Slider drag → write live override; release → commit.
    const previewProp = useCallback((updates) => {
        if (!selectedId)
            return;
        useLiveNodeOverrides.getState().set(selectedId, updates);
    }, [selectedId]);
    const commitProp = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
        if (updates.roofSegmentId !== undefined) {
            const state = useScene.getState();
            const prev = node?.roofSegmentId;
            if (prev)
                state.dirtyNodes.add(prev);
            state.dirtyNodes.add(updates.roofSegmentId);
            state.dirtyNodes.add(selectedId);
        }
        useLiveNodeOverrides.getState().clear(selectedId);
    }, [node, selectedId, updateNode]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleBack = useCallback(() => {
        if (node?.roofSegmentId) {
            setSelection({ selectedIds: [node.roofSegmentId] });
        }
    }, [node?.roofSegmentId, setSelection]);
    const handleMove = useCallback(() => {
        if (!(node && selectedId))
            return;
        triggerSFX('sfx:item-pick');
        setMovingNode(node);
        setSelection({ selectedIds: [] });
    }, [node, selectedId, setMovingNode, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!(node && node.roofSegmentId))
            return;
        triggerSFX('sfx:item-pick');
        // Deep clone and strip the id so the move tool's onClick branch
        // (`isNew || !node.id`) takes the "create fresh" path. Setting
        // `metadata.isNew = true` is what gates the move tool from
        // updating any existing node — the dormer is only added to the
        // scene on click, not when the Duplicate button is pressed.
        const cloned = structuredClone(node);
        delete cloned.id;
        const prevMeta = cloned.metadata && typeof cloned.metadata === 'object' && !Array.isArray(cloned.metadata)
            ? cloned.metadata
            : {};
        cloned.metadata = { ...prevMeta, isNew: true };
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
            const segment = state.nodes[segmentId];
            if (segment) {
                state.updateNode(segmentId, {
                    children: (segment.children ?? []).filter((id) => id !== selectedId),
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
    if (!(node && node.type === 'dormer' && selectedId))
        return null;
    const scenestate = useScene.getState();
    const segment = node.roofSegmentId
        ? scenestate.nodes[node.roofSegmentId]
        : undefined;
    const roof = segment?.parentId
        ? scenestate.nodes[segment.parentId]
        : undefined;
    return (_jsxs(PanelWrapper, { icon: "/icons/roof.png", onBack: node.roofSegmentId ? handleBack : undefined, onClose: handleClose, title: node.name || 'Dormer', width: 300, children: [_jsx(DormerPositionSection, { commitProp: commitProp, node: node, previewProp: previewProp, roof: roof, segment: segment, selectedId: selectedId }), _jsx(PanelSection, { title: "Section", children: _jsx("div", { className: "grid grid-cols-3 gap-1.5 px-1 pt-1", children: SECTION_OPTIONS.map((option) => {
                        const isSelected = section === option.value;
                        return (_jsx("button", { className: cn('flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-center text-xs transition-colors', isSelected
                                ? 'border-orange-400/60 bg-orange-400/10 text-foreground'
                                : 'border-border/50 bg-[#2C2C2E] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground'), onClick: () => setSection(option.value), type: "button", children: _jsx("span", { className: "truncate font-medium", children: option.label }) }, option.value));
                    }) }) }), section === 'dormer' && (_jsxs(_Fragment, { children: [_jsxs(PanelSection, { title: "Dimensions", children: [_jsx(SliderControl, { label: "Width", max: 4, min: 0.5, onChange: (v) => previewProp({ width: v }), onCommit: (v) => commitProp({ width: v }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(node.width * 100) / 100 }), _jsx(SliderControl, { label: "Depth", max: 5, min: 0.5, onChange: (v) => previewProp({ depth: v }), onCommit: (v) => commitProp({ depth: v }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(node.depth * 100) / 100 }), _jsx(SliderControl, { label: "Wall Height", max: 5, min: 0, onChange: (v) => previewProp({ height: v }), onCommit: (v) => commitProp({ height: v }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(node.height * 100) / 100 }), _jsx(SliderControl, { label: "Roof Height", max: 3, min: 0, onChange: (v) => previewProp({ roofHeight: v }), onCommit: (v) => commitProp({ roofHeight: v }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(node.roofHeight * 100) / 100 })] }), _jsx(PanelSection, { title: "Roof Type", children: _jsx("div", { className: "grid grid-cols-3 gap-1.5 px-1 pt-1", children: ROOF_TYPE_OPTIONS.map((option) => {
                                const isSelected = node.roofType === option.value;
                                return (_jsx("button", { className: cn('flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-xs transition-colors', isSelected
                                        ? 'border-orange-400/60 bg-orange-400/10 text-foreground'
                                        : 'border-border/50 bg-[#2C2C2E] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground'), onClick: () => handleUpdate({ roofType: option.value }), type: "button", children: _jsx("span", { className: "truncate font-medium", children: option.label }) }, option.value));
                            }) }) })] })), section === 'window' && (_jsx(DormerWindowSection, { commitProp: commitProp, handleUpdate: handleUpdate, node: node, previewProp: previewProp })), _jsx(DormerActionsSection, { onDelete: handleDelete, onDuplicate: handleDuplicate, onMove: handleMove })] }));
}
