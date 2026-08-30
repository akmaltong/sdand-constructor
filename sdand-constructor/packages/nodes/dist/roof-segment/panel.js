'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RoofSegmentNode as RoofSegmentNodeSchema, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, PanelSection, PanelWrapper, SegmentedControl, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Move, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
const ROOF_TYPE_OPTIONS = [
    { label: 'Hip', value: 'hip' },
    { label: 'Gable', value: 'gable' },
    { label: 'Shed', value: 'shed' },
    { label: 'Flat', value: 'flat' },
];
const ROOF_TYPE_OPTIONS_2 = [
    { label: 'Gambrel', value: 'gambrel' },
    { label: 'Dutch', value: 'dutch' },
    { label: 'Mansard', value: 'mansard' },
];
// Carpenter / roofer convention: rise over a 12" run, converted to degrees.
// atan(3/12) ≈ 14.04°, atan(6/12) ≈ 26.57°, atan(9/12) ≈ 36.87°, atan(12/12) = 45°.
const PITCH_PRESETS = [
    { label: '3/12', deg: 14.04 },
    { label: '6/12', deg: 26.57 },
    { label: '9/12', deg: 36.87 },
    { label: '12/12', deg: 45 },
];
export default function RoofSegmentPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
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
        // Offset slightly so it's visible
        duplicateInfo.position = [
            duplicateInfo.position[0] + 1,
            duplicateInfo.position[1],
            duplicateInfo.position[2] + 1,
        ];
        try {
            const duplicate = RoofSegmentNodeSchema.parse(duplicateInfo);
            useScene.getState().createNode(duplicate, duplicate.parentId);
            setSelection({ selectedIds: [] });
            setMovingNode(duplicate);
        }
        catch (e) {
            console.error('Failed to duplicate roof segment', e);
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
    if (!(node && node.type === 'roof-segment' && selectedId))
        return null;
    return (_jsxs(PanelWrapper, { icon: "/icons/roof.png", onBack: handleBack, onClose: handleClose, title: node.name || 'Roof Segment', width: 300, children: [_jsxs(PanelSection, { title: "Roof Type", children: [_jsx(SegmentedControl, { onChange: (v) => handleUpdate({ roofType: v }), options: ROOF_TYPE_OPTIONS, value: node.roofType }), _jsx(SegmentedControl, { onChange: (v) => handleUpdate({ roofType: v }), options: ROOF_TYPE_OPTIONS_2, value: node.roofType })] }), _jsxs(PanelSection, { title: "Footprint", children: [_jsx(SliderControl, { label: "Width", max: 25, min: 0.5, onChange: (v) => handleUpdate({ width: v }), precision: 2, step: 0.5, unit: "m", value: Math.round(node.width * 100) / 100 }), _jsx(SliderControl, { label: "Depth", max: 25, min: 0.5, onChange: (v) => handleUpdate({ depth: v }), precision: 2, step: 0.5, unit: "m", value: Math.round(node.depth * 100) / 100 })] }), _jsx(PanelSection, { title: "Wall Height", children: _jsx(SliderControl, { label: "Wall", max: 5, min: 0, onChange: (v) => handleUpdate({ wallHeight: v }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.wallHeight * 100) / 100 }) }), _jsxs(PanelSection, { title: "Pitch", children: [_jsx(SliderControl, { label: "Angle", max: 60, min: 0, onChange: (v) => handleUpdate({ pitch: v }), precision: 0, step: 1, unit: "\u00B0", value: Math.round(node.pitch) }), _jsx("div", { className: "flex gap-1.5 px-1 pt-2 pb-1", children: PITCH_PRESETS.map((preset) => (_jsx(ActionButton, { label: preset.label, onClick: () => handleUpdate({ pitch: preset.deg }) }, preset.label))) })] }), node.roofType === 'gambrel' && (_jsxs(PanelSection, { title: "Shape", children: [_jsx(SliderControl, { label: "Kink Depth", max: 0.9, min: 0.1, onChange: (v) => handleUpdate({ gambrelLowerWidthRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.gambrelLowerWidthRatio * 100) / 100 }), _jsx(SliderControl, { label: "Kink Height", max: 0.9, min: 0.1, onChange: (v) => handleUpdate({ gambrelLowerHeightRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.gambrelLowerHeightRatio * 100) / 100 })] })), node.roofType === 'mansard' && (_jsxs(PanelSection, { title: "Shape", children: [_jsx(SliderControl, { label: "Waist Width", max: 0.45, min: 0.05, onChange: (v) => handleUpdate({ mansardSteepWidthRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.mansardSteepWidthRatio * 100) / 100 }), _jsx(SliderControl, { label: "Waist Height", max: 0.9, min: 0.1, onChange: (v) => handleUpdate({ mansardSteepHeightRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.mansardSteepHeightRatio * 100) / 100 })] })), node.roofType === 'dutch' && (_jsxs(PanelSection, { title: "Shape", children: [_jsx(SliderControl, { label: "Hip Width", max: 0.45, min: 0.05, onChange: (v) => handleUpdate({ dutchHipWidthRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.dutchHipWidthRatio * 100) / 100 }), _jsx(SliderControl, { label: "Hip Height", max: 0.9, min: 0.1, onChange: (v) => handleUpdate({ dutchHipHeightRatio: v }), precision: 2, step: 0.01, unit: "", value: Math.round(node.dutchHipHeightRatio * 100) / 100 })] })), _jsxs(PanelSection, { title: "Structure", children: [_jsx(SliderControl, { label: "Wall Thick.", max: 1, min: 0.05, onChange: (v) => handleUpdate({ wallThickness: v }), precision: 2, step: 0.05, unit: "m", value: Math.round(node.wallThickness * 100) / 100 }), _jsx(SliderControl, { label: "Deck Thick.", max: 0.3, min: 0.04, onChange: (v) => handleUpdate({ deckThickness: v }), precision: 2, step: 0.01, unit: "m", value: Math.round(node.deckThickness * 100) / 100 }), _jsx(SliderControl, { label: "Overhang", max: 1, min: 0, onChange: (v) => handleUpdate({ overhang: v }), precision: 2, step: 0.05, unit: "m", value: Math.round(node.overhang * 100) / 100 }), _jsx(SliderControl, { label: "Shingle Thick.", max: 0.3, min: 0.02, onChange: (v) => handleUpdate({ shingleThickness: v }), precision: 2, step: 0.01, unit: "m", value: Math.round(node.shingleThickness * 100) / 100 })] }), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: "X", max: 50, min: -50, onChange: (v) => {
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
