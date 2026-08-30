'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useScene } from '@pascal-app/core';
import { ActionButton, ActionGroup, PanelSection, PanelWrapper, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Edit, Move, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
/**
 * Phase 5 Stage E — ceiling inspector (kind-owned).
 *
 * 1:1 port of the legacy `CeilingPanel`. Mounted via
 * `parametrics.customPanel`. Same rationale as slab/panel.tsx — the
 * holes list + height presets need richer field kinds before this
 * panel can collapse into auto-derived groups.
 */
export function CeilingPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const editingHole = useEditor((s) => s.editingHole);
    const setEditingHole = useEditor((s) => s.setEditingHole);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    // Panel slider-drag fix recipe (plans/editor-node-registry.md): stable
    // handler refs so slider drags don't trigger Maximum update depth.
    const nodeRef = useRef(node);
    nodeRef.current = node;
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        useScene.getState().updateNode(selectedId, updates);
    }, [selectedId]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
        setEditingHole(null);
    }, [setSelection, setEditingHole]);
    useEffect(() => {
        if (!node) {
            setEditingHole(null);
        }
    }, [node, setEditingHole]);
    useEffect(() => {
        return () => {
            setEditingHole(null);
        };
    }, [setEditingHole]);
    const handleAddHole = useCallback(() => {
        if (!(node && selectedId))
            return;
        const polygon = node.polygon;
        let cx = 0;
        let cz = 0;
        for (const [x, z] of polygon) {
            cx += x;
            cz += z;
        }
        cx /= polygon.length;
        cz /= polygon.length;
        const holeSize = 0.5;
        const newHole = [
            [cx - holeSize, cz - holeSize],
            [cx + holeSize, cz - holeSize],
            [cx + holeSize, cz + holeSize],
            [cx - holeSize, cz + holeSize],
        ];
        const currentHoles = node?.holes || [];
        const currentMetadata = currentHoles.map((_, index) => node?.holeMetadata?.[index] ?? { source: 'manual' });
        handleUpdate({
            holes: [...currentHoles, newHole],
            holeMetadata: [...currentMetadata, { source: 'manual' }],
        });
        setEditingHole({ nodeId: selectedId, holeIndex: currentHoles.length });
    }, [node, selectedId, handleUpdate, setEditingHole]);
    const handleEditHole = useCallback((index) => {
        if (!selectedId)
            return;
        setEditingHole({ nodeId: selectedId, holeIndex: index });
    }, [selectedId, setEditingHole]);
    const handleDeleteHole = useCallback((index) => {
        if (!selectedId)
            return;
        const currentHoles = node?.holes || [];
        if ((node?.holeMetadata?.[index]?.source ?? 'manual') !== 'manual')
            return;
        const newHoles = currentHoles.filter((_, i) => i !== index);
        const currentMetadata = currentHoles.map((_, metadataIndex) => node?.holeMetadata?.[metadataIndex] ?? { source: 'manual' });
        const newMetadata = currentMetadata.filter((_, i) => i !== index);
        handleUpdate({ holes: newHoles, holeMetadata: newMetadata });
        if (editingHole?.nodeId === selectedId && editingHole?.holeIndex === index) {
            setEditingHole(null);
        }
    }, [selectedId, node?.holes, node?.holeMetadata, handleUpdate, editingHole, setEditingHole]);
    const handleMove = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        setMovingNode(node);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    if (!(node && node.type === 'ceiling' && selectedId))
        return null;
    const calculateArea = (polygon) => {
        if (polygon.length < 3)
            return 0;
        let area = 0;
        const n = polygon.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const current = polygon[i];
            const next = polygon[j];
            area += current[0] * next[1];
            area -= next[0] * current[1];
        }
        return Math.abs(area) / 2;
    };
    const area = calculateArea(node.polygon);
    return (_jsxs(PanelWrapper, { icon: "/icons/ceiling.png", onClose: handleClose, title: node.name || 'Ceiling', width: 320, children: [_jsxs(PanelSection, { title: "Height", children: [_jsx(SliderControl, { label: "Height", max: 6, min: 0, onChange: (v) => handleUpdate({ height: v }), precision: 3, step: 0.01, unit: "m", value: Math.round(node.height * 1000) / 1000 }), _jsxs("div", { className: "mt-2 grid grid-cols-3 gap-1.5 px-1 pb-1", children: [_jsx(ActionButton, { label: "Low (2.4m)", onClick: () => handleUpdate({ height: 2.4 }) }), _jsx(ActionButton, { label: "Standard (2.5m)", onClick: () => handleUpdate({ height: 2.5 }) }), _jsx(ActionButton, { label: "High (3.0m)", onClick: () => handleUpdate({ height: 3.0 }) })] })] }), _jsx(PanelSection, { title: "Info", children: _jsxs("div", { className: "flex items-center justify-between px-2 py-1 text-muted-foreground text-sm", children: [_jsx("span", { children: "Area" }), _jsxs("span", { className: "font-mono text-white", children: [area.toFixed(2), " m\u00B2"] })] }) }), _jsxs(PanelSection, { title: "Holes", children: [node.holes && node.holes.length > 0 ? (_jsx("div", { className: "flex flex-col gap-1 pb-2", children: node.holes.map((hole, index) => {
                            const holeArea = calculateArea(hole);
                            const isEditing = editingHole?.nodeId === selectedId && editingHole?.holeIndex === index;
                            const source = node.holeMetadata?.[index]?.source ?? 'manual';
                            const isAutoHole = source !== 'manual';
                            const autoLabel = source === 'elevator' ? 'Auto elevator cutout' : 'Auto stair cutout';
                            return (_jsxs("div", { className: `flex items-center justify-between rounded-lg border p-2 transition-colors ${isEditing
                                    ? 'border-primary/50 bg-primary/10'
                                    : 'border-transparent hover:bg-accent/30'}`, children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("p", { className: `font-medium text-xs ${isEditing ? 'text-primary' : 'text-white'}`, children: ["Hole ", index + 1, " ", isEditing && '(Editing)'] }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [holeArea.toFixed(2), " m\u00B2 \u00B7 ", hole.length, " pts \u00B7", ' ', isAutoHole ? autoLabel : 'Manual'] })] }), _jsx("div", { className: "flex items-center gap-1", children: isEditing ? (_jsx(ActionButton, { className: "h-7 bg-primary text-primary-foreground hover:bg-primary/90", label: "Done", onClick: () => setEditingHole(null) })) : isAutoHole ? (_jsx("div", { className: "rounded-md bg-[#2C2C2E] px-2 py-1 text-[10px] text-muted-foreground", children: "Auto" })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "flex h-7 w-7 items-center justify-center rounded-md bg-[#2C2C2E] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground", onClick: () => handleEditHole(index), type: "button", children: _jsx(Edit, { className: "h-3.5 w-3.5" }) }), _jsx("button", { className: "flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300", onClick: () => handleDeleteHole(index), type: "button", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] })) })] }, index));
                        }) })) : (_jsx("div", { className: "px-2 py-3 text-center text-muted-foreground text-xs", children: "No holes" })), _jsx("div", { className: "px-1 pt-1 pb-1", children: _jsx(ActionButton, { className: "w-full", disabled: editingHole?.nodeId === selectedId, icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Hole", onClick: handleAddHole }) })] }), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }) })] }));
}
export default CeilingPanel;
