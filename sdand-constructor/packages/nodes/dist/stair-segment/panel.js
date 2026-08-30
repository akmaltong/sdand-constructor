'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { StairSegmentNode as StairSegmentNodeSchema, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, PanelSection, PanelWrapper, SegmentedControl, SliderControl, ToggleControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Move, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
const SEGMENT_TYPE_OPTIONS = [
    { label: 'Flight', value: 'stair' },
    { label: 'Landing', value: 'landing' },
];
const ATTACHMENT_SIDE_OPTIONS = [
    { label: 'Front', value: 'front' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
];
export default function StairSegmentPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    // Boolean selector — re-renders only when this segment's position among the
    // parent stair's children flips to/from "first".
    const isFirstSegment = useScene((s) => {
        if (!node?.parentId)
            return true;
        const parent = s.nodes[node.parentId];
        if (!parent || parent.type !== 'stair')
            return true;
        const children = parent.children ?? [];
        return children[0] === node.id;
    });
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
    }, [selectedId, updateNode]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleBack = useCallback(() => {
        if (node?.parentId) {
            setSelection({ selectedIds: [node.parentId] });
        }
    }, [node?.parentId, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node?.parentId)
            return;
        triggerSFX('sfx:item-pick');
        let duplicateInfo = structuredClone(node);
        delete duplicateInfo.id;
        duplicateInfo.metadata = { ...duplicateInfo.metadata, isNew: true };
        duplicateInfo.position = [
            duplicateInfo.position[0] + 1,
            duplicateInfo.position[1],
            duplicateInfo.position[2] + 1,
        ];
        try {
            const duplicate = StairSegmentNodeSchema.parse(duplicateInfo);
            useScene.getState().createNode(duplicate, duplicate.parentId);
            setSelection({ selectedIds: [] });
            setMovingNode(duplicate);
        }
        catch (e) {
            console.error('Failed to duplicate stair segment', e);
        }
    }, [node, setSelection, setMovingNode]);
    const handleMove = useCallback(() => {
        if (node) {
            triggerSFX('sfx:item-pick');
            setMovingNode(node);
            setSelection({ selectedIds: [] });
        }
    }, [node, setMovingNode, setSelection]);
    const handleDelete = useCallback(() => {
        if (!(selectedId && node))
            return;
        triggerSFX('sfx:item-delete');
        const parentId = node.parentId;
        useScene.getState().deleteNode(selectedId);
        if (parentId) {
            useScene.getState().dirtyNodes.add(parentId);
            setSelection({ selectedIds: [parentId] });
        }
        else {
            setSelection({ selectedIds: [] });
        }
    }, [selectedId, node, setSelection]);
    if (!(node && node.type === 'stair-segment' && selectedId))
        return null;
    return (_jsxs(PanelWrapper, { icon: "/icons/stairs.png", onBack: handleBack, onClose: handleClose, title: node.name || 'Stair Segment', width: 300, children: [_jsx(PanelSection, { title: "Type", children: _jsx(SegmentedControl, { onChange: (v) => {
                        const updates = { segmentType: v };
                        if (v === 'landing') {
                            updates.height = 0;
                            updates.stepCount = 0;
                            updates.length = 1.0;
                        }
                        else {
                            updates.height = 2.5;
                            updates.stepCount = 10;
                            updates.length = 3.0;
                        }
                        handleUpdate(updates);
                    }, options: SEGMENT_TYPE_OPTIONS, value: node.segmentType }) }), !isFirstSegment && (_jsx(PanelSection, { title: "Attachment", children: _jsx(SegmentedControl, { onChange: (v) => handleUpdate({ attachmentSide: v }), options: ATTACHMENT_SIDE_OPTIONS, value: node.attachmentSide }) })), _jsxs(PanelSection, { title: "Dimensions", children: [_jsx(SliderControl, { label: "Width", max: 5, min: 0.5, onChange: (v) => handleUpdate({ width: v }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.width * 100) / 100 }), _jsx(SliderControl, { label: "Length", max: 10, min: 0.5, onChange: (v) => handleUpdate({ length: v }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.length * 100) / 100 }), node.segmentType === 'stair' && (_jsxs(_Fragment, { children: [_jsx(SliderControl, { label: "Height", max: 10, min: 0.5, onChange: (v) => handleUpdate({ height: v }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.height * 100) / 100 }), _jsx(SliderControl, { label: "Steps", max: 30, min: 2, onChange: (v) => handleUpdate({ stepCount: Math.round(v) }), precision: 0, step: 1, unit: "", value: node.stepCount })] }))] }), _jsx(PanelSection, { title: "Structure", children: _jsxs("div", { className: "space-y-3", children: [_jsx(ToggleControl, { checked: node.fillToFloor, label: "Fill to floor", onChange: (checked) => handleUpdate({ fillToFloor: checked }) }), !node.fillToFloor && (_jsx(SliderControl, { label: "Thickness", max: 1, min: 0.05, onChange: (v) => handleUpdate({ thickness: v }), precision: 2, step: 0.05, unit: "m", value: Math.round((node.thickness ?? 0.25) * 100) / 100 }))] }) }), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: "X", max: 50, min: -50, onChange: (v) => {
                            const pos = [...node.position];
                            pos[0] = v;
                            handleUpdate({ position: pos });
                        }, precision: 2, step: 0.05, unit: "m", value: Math.round(node.position[0] * 100) / 100 }), _jsx(SliderControl, { label: "Y", max: 50, min: -50, onChange: (v) => {
                            const pos = [...node.position];
                            pos[1] = v;
                            handleUpdate({ position: pos });
                        }, precision: 2, step: 0.05, unit: "m", value: Math.round(node.position[1] * 100) / 100 }), _jsx(SliderControl, { label: "Z", max: 50, min: -50, onChange: (v) => {
                            const pos = [...node.position];
                            pos[2] = v;
                            handleUpdate({ position: pos });
                        }, precision: 2, step: 0.05, unit: "m", value: Math.round(node.position[2] * 100) / 100 }), _jsx(SliderControl, { label: "Rotation", max: 180, min: -180, onChange: (degrees) => {
                            handleUpdate({ rotation: (degrees * Math.PI) / 180 });
                        }, precision: 0, step: 1, unit: "\u00B0", value: Math.round((node.rotation * 180) / Math.PI) }), _jsxs("div", { className: "flex gap-1.5 px-1 pt-2 pb-1", children: [_jsx(ActionButton, { label: "-45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    handleUpdate({ rotation: node.rotation - Math.PI / 4 });
                                } }), _jsx(ActionButton, { label: "+45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    handleUpdate({ rotation: node.rotation + Math.PI / 4 });
                                } })] })] }), _jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: handleDelete })] }) })] }));
}
