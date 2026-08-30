'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { getScaledDimensions, ItemNode, useScene } from '@pascal-app/core';
import { ActionButton, ActionGroup, CollectionsPopover, PanelSection, PanelWrapper, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Link, Link2Off, Move, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
/**
 * Stage E inspector for item. 1:1 port of the legacy
 * `editor/components/ui/panels/item-panel.tsx`, relocated into the
 * kind's folder so `parametrics.customPanel` mounts it through the
 * registry inspector. The catalog popover (`<CollectionsPopover>`) is
 * the only kind-specific UI that can't be expressed via the generic
 * auto-inspector today — kept inline.
 *
 * Slider-drag fix recipe applied: scale / position / rotation slider
 * `onChange` callbacks read from a `useRef(node)` instead of the
 * closure-captured node, which would re-render every panel-driven
 * update mid-drag and exceed React's update-depth budget on big scenes
 * (see the wiki / plan recipe).
 */
export default function ItemPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const deleteNode = useScene((s) => s.deleteNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    const [uniformScale, setUniformScale] = useState(true);
    const nodeRef = useRef(node);
    nodeRef.current = node;
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        const n = nodeRef.current;
        if (!n)
            return;
        useScene.getState().updateNode(selectedId, updates);
        // When an item is mounted on a wall, dirty the wall so the next
        // frame regenerates its cutout geometry around the moved item.
        if (n.asset.attachTo === 'wall' && n.parentId) {
            requestAnimationFrame(() => {
                useScene.getState().markDirty(n.parentId);
            });
        }
    }, [selectedId]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleMove = useCallback(() => {
        if (node) {
            triggerSFX('sfx:item-pick');
            setMovingNode(node);
            setSelection({ selectedIds: [] });
        }
    }, [node, setMovingNode, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        const proto = ItemNode.parse({
            position: [...node.position],
            rotation: [...node.rotation],
            name: node.name,
            asset: node.asset,
            parentId: node.parentId,
            side: node.side,
            metadata: { isNew: true },
        });
        setMovingNode(proto);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    const handleDelete = useCallback(() => {
        if (!selectedId)
            return;
        triggerSFX('sfx:item-delete');
        deleteNode(selectedId);
        setSelection({ selectedIds: [] });
    }, [selectedId, deleteNode, setSelection]);
    if (!(node && node.type === 'item' && selectedId))
        return null;
    return (_jsxs(PanelWrapper, { icon: node.asset.thumbnail || '/icons/furniture.png', onClose: handleClose, title: node.name || node.asset.name, width: 300, children: [_jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["X", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "pos" })] }), max: node.position[0] + 2, min: node.position[0] - 2, onChange: (value) => handleUpdate({ position: [value, node.position[1], node.position[2]] }), precision: 2, step: 0.01, unit: "m", value: Math.round(node.position[0] * 100) / 100 }), _jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Y", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "pos" })] }), max: node.position[1] + 2, min: node.position[1] - 2, onChange: (value) => handleUpdate({ position: [node.position[0], value, node.position[2]] }), precision: 2, step: 0.01, unit: "m", value: Math.round(node.position[1] * 100) / 100 }), _jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Z", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "pos" })] }), max: node.position[2] + 2, min: node.position[2] - 2, onChange: (value) => handleUpdate({ position: [node.position[0], node.position[1], value] }), precision: 2, step: 0.01, unit: "m", value: Math.round(node.position[2] * 100) / 100 })] }), _jsxs(PanelSection, { title: "Rotation", children: [_jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Y", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "rot" })] }), max: Math.round((node.rotation[1] * 180) / Math.PI) + 45, min: Math.round((node.rotation[1] * 180) / Math.PI) - 45, onChange: (degrees) => {
                            const radians = (degrees * Math.PI) / 180;
                            handleUpdate({ rotation: [node.rotation[0], radians, node.rotation[2]] });
                        }, precision: 0, step: 1, unit: "\u00B0", value: Math.round((node.rotation[1] * 180) / Math.PI) }), _jsxs("div", { className: "flex gap-1.5 px-1 pt-2 pb-1", children: [_jsx(ActionButton, { label: "-45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    const currentDegrees = (node.rotation[1] * 180) / Math.PI;
                                    const radians = ((currentDegrees - 45) * Math.PI) / 180;
                                    handleUpdate({ rotation: [node.rotation[0], radians, node.rotation[2]] });
                                } }), _jsx(ActionButton, { label: "+45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    const currentDegrees = (node.rotation[1] * 180) / Math.PI;
                                    const radians = ((currentDegrees + 45) * Math.PI) / 180;
                                    handleUpdate({ rotation: [node.rotation[0], radians, node.rotation[2]] });
                                } })] })] }), _jsxs(PanelSection, { title: "Scale", children: [_jsxs("div", { className: "flex items-center justify-between px-2 pb-2", children: [_jsx("span", { className: "font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider", children: "Uniform Scale" }), _jsx("button", { className: uniformScale
                                    ? 'flex h-6 w-6 items-center justify-center rounded-md bg-[#3e3e3e] text-muted-foreground transition-colors hover:text-foreground'
                                    : 'flex h-6 w-6 items-center justify-center rounded-md bg-[#2C2C2E] text-muted-foreground transition-colors hover:bg-[#3e3e3e] hover:text-foreground', onClick: () => setUniformScale((v) => !v), type: "button", children: uniformScale ? _jsx(Link, { className: "h-3.5 w-3.5" }) : _jsx(Link2Off, { className: "h-3.5 w-3.5" }) })] }), uniformScale ? (_jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["XYZ", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "scale" })] }), max: 10, min: 0.01, onChange: (value) => {
                            const v = Math.max(0.01, value);
                            handleUpdate({ scale: [v, v, v] });
                        }, precision: 2, step: 0.1, value: Math.round(node.scale[0] * 100) / 100 })) : (_jsxs(_Fragment, { children: [_jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["X", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "scale" })] }), max: 10, min: 0.01, onChange: (value) => handleUpdate({ scale: [Math.max(0.01, value), node.scale[1], node.scale[2]] }), precision: 2, step: 0.1, value: Math.round(node.scale[0] * 100) / 100 }), _jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Y", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "scale" })] }), max: 10, min: 0.01, onChange: (value) => handleUpdate({ scale: [node.scale[0], Math.max(0.01, value), node.scale[2]] }), precision: 2, step: 0.1, value: Math.round(node.scale[1] * 100) / 100 }), _jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Z", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "scale" })] }), max: 10, min: 0.01, onChange: (value) => handleUpdate({ scale: [node.scale[0], node.scale[1], Math.max(0.01, value)] }), precision: 2, step: 0.1, value: Math.round(node.scale[2] * 100) / 100 })] }))] }), _jsx(PanelSection, { title: "Info", children: _jsxs("div", { className: "flex items-center justify-between px-2 py-1 text-muted-foreground text-sm", children: [_jsx("span", { children: "Dimensions" }), (() => {
                            const [w, h, d] = getScaledDimensions(node);
                            return (_jsxs("span", { className: "font-mono text-white", children: [Math.round(w * 100) / 100, "\u00D7", Math.round(h * 100) / 100, "\u00D7", Math.round(d * 100) / 100] }));
                        })()] }) }), _jsx(PanelSection, { title: "Collections", children: _jsx(ActionGroup, { children: _jsx(CollectionsPopover, { collectionIds: node.collectionIds, nodeId: selectedId, children: _jsx(ActionButton, { label: "Manage collections\u2026" }) }) }) }), _jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: handleDelete })] }) })] }));
}
