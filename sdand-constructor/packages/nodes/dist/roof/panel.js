'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RoofSegmentNode as RoofSegmentNodeSchema, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, duplicateRoofSubtree, PanelSection, PanelWrapper, SegmentedControl, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Move, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
export default function RoofPanel() {
    const [ventType, setVentType] = useState('box-vent');
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const createNode = useScene((s) => s.createNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    // Shallow selector — only re-renders when the segment list content changes.
    const segments = useScene(useShallow((s) => {
        if (!node)
            return [];
        return (node.children ?? [])
            .map((childId) => s.nodes[childId])
            .filter((n) => n?.type === 'roof-segment');
    }));
    // Flatten roof accessories hosted by any segment of this roof. Each
    // selector re-runs only when the relevant child list changes.
    const segmentIdSet = useScene(useShallow((s) => {
        if (!node)
            return new Set();
        return new Set((node.children ?? []));
    }));
    const chimneys = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'chimney' && n.roofSegmentId && segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    const skylights = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'skylight' && n.roofSegmentId && segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    const solarPanels = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'solar-panel' && n.roofSegmentId && segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    const dormers = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'dormer' && n.roofSegmentId && segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    const gutters = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'gutter' && n.roofSegmentId && segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    // Box vents and ridge vents share the "Vents" UI group — same list,
    // type shown as the right-side label, and an `Add Vent` button with
    // a Box/Ridge segmented picker.
    const vents = useScene(useShallow((s) => {
        if (segmentIdSet.size === 0)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if ((n?.type === 'box-vent' || n?.type === 'ridge-vent' || n?.type === 'turbine-vent') &&
                n.roofSegmentId &&
                segmentIdSet.has(n.roofSegmentId)) {
                out.push(n);
            }
        }
        return out;
    }));
    const handleSelectElement = useCallback((id) => {
        setSelection({ selectedIds: [id] });
    }, [setSelection]);
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
    }, [selectedId, updateNode]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleAddSegment = useCallback(() => {
        if (!node)
            return;
        const segment = RoofSegmentNodeSchema.parse({
            width: 6,
            depth: 6,
            wallHeight: 0.5,
            pitch: 40,
            roofType: 'gable',
            position: [2, 0, 2],
        });
        createNode(segment, node.id);
    }, [node, createNode]);
    const handleSelectSegment = useCallback((segmentId) => {
        setSelection({ selectedIds: [segmentId] });
    }, [setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        try {
            duplicateRoofSubtree(node.id, { mode: 'move' });
        }
        catch (e) {
            console.error('Failed to duplicate roof', e);
        }
    }, [node]);
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
        }
        setSelection({ selectedIds: [] });
    }, [selectedId, node, setSelection]);
    // Each "Add" button activates the kind's registered placement tool
    // via `setTool(kind)`. The tool listens for `roof:*` events and
    // commits a new node parented to whichever segment the user clicks.
    // Same code path as the top palette — see `tool-manager.tsx:28`'s
    // `nodeRegistry.get(tool)?.tool` dispatch.
    const activateTool = useCallback((kind) => {
        triggerSFX('sfx:item-pick');
        useEditor.getState().setTool(kind);
        if (useEditor.getState().mode !== 'build') {
            useEditor.getState().setMode('build');
        }
    }, []);
    if (!(node && node.type === 'roof' && selectedId))
        return null;
    return (_jsxs(PanelWrapper, { icon: "/icons/roof.png", onClose: handleClose, title: node.name || 'Roof', width: 300, children: [_jsxs(PanelSection, { title: "Segments", children: [_jsx("div", { className: "flex flex-col gap-1", children: segments.map((seg, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectSegment(seg.id), type: "button", children: [_jsx("span", { className: "truncate", children: seg.name || `Segment ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs capitalize", children: seg.roofType })] }, seg.id))) }), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Segment", onClick: handleAddSegment }) })] }), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: "X", max: 50, min: -50, onChange: (v) => {
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
                                } })] })] }), _jsx(PanelSection, { title: "Elements", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [chimneys.map((chimney, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(chimney.id), type: "button", children: [_jsx("span", { className: "truncate", children: chimney.name || `Chimney ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs", children: "chimney" })] }, chimney.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Chimney", onClick: () => activateTool('chimney') }) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [dormers.map((dormer, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(dormer.id), type: "button", children: [_jsx("span", { className: "truncate", children: dormer.name || `Dormer ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs", children: "dormer" })] }, dormer.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Dormer", onClick: () => activateTool('dormer') }) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [skylights.map((skylight, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(skylight.id), type: "button", children: [_jsx("span", { className: "truncate", children: skylight.name || `Skylight ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs", children: "skylight" })] }, skylight.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Skylight", onClick: () => activateTool('skylight') }) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [solarPanels.map((panel, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(panel.id), type: "button", children: [_jsx("span", { className: "truncate", children: panel.name || `Solar Panel ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs", children: "solar panel" })] }, panel.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Solar Panel", onClick: () => activateTool('solar-panel') }) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [vents.map((vent, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(vent.id), type: "button", children: [_jsx("span", { className: "truncate", children: vent.name ||
                                                (vent.type === 'box-vent'
                                                    ? `Box Vent ${i + 1}`
                                                    : vent.type === 'ridge-vent'
                                                        ? `Ridge Vent ${i + 1}`
                                                        : `Turbine Vent ${i + 1}`) }), _jsx("span", { className: "text-muted-foreground text-xs", children: vent.type === 'box-vent'
                                                ? 'box vent'
                                                : vent.type === 'ridge-vent'
                                                    ? 'ridge vent'
                                                    : 'turbine vent' })] }, vent.id))), _jsx(SegmentedControl, { onChange: setVentType, options: [
                                        { label: 'Box', value: 'box-vent' },
                                        { label: 'Ridge', value: 'ridge-vent' },
                                        { label: 'Turbine', value: 'turbine-vent' },
                                    ], value: ventType }), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Vent", onClick: () => activateTool(ventType) }) })] }), _jsx("div", { className: "flex flex-col gap-1", children: _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Cupola", onClick: () => activateTool('cupola') }) }) }), _jsx("div", { className: "flex flex-col gap-1", children: _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Eyebrow Vent", onClick: () => activateTool('eyebrow-vent') }) }) }), _jsxs("div", { className: "flex flex-col gap-1", children: [gutters.map((gutter, i) => (_jsxs("button", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm transition-colors hover:bg-[#3e3e3e]", onClick: () => handleSelectElement(gutter.id), type: "button", children: [_jsx("span", { className: "truncate", children: gutter.name || `Gutter ${i + 1}` }), _jsx("span", { className: "text-muted-foreground text-xs", children: "gutter" })] }, gutter.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { icon: _jsx(Plus, { className: "h-3.5 w-3.5" }), label: "Add Gutter", onClick: () => activateTool('gutter') }) })] })] }) }), _jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: handleDelete })] }) })] }));
}
