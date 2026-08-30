'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ElevatorNode as ElevatorNodeSchema, requestElevatorLevel, useInteractive, useLiveNodeOverrides, useLiveTransforms, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, MetricControl, PanelSection, PanelWrapper, resolveElevatorNodeSupportY, resolveElevatorSupportY, SliderControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, Move, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
function findLevelId(levels, levelId) {
    if (!levelId)
        return null;
    return levels.some((level) => level.id === levelId) ? levelId : null;
}
function getLegacyServedLevels(node, levels) {
    if (!node || node.fromLevelId || node.toLevelId || !node.servedLevelIds?.length)
        return [];
    const servedIds = new Set(node.servedLevelIds);
    return levels.filter((level) => servedIds.has(level.id));
}
function getResolvedFromLevelId(node, levels) {
    if (!node)
        return levels[0]?.id ?? '';
    const legacyServedLevels = getLegacyServedLevels(node, levels);
    return (findLevelId(levels, node.fromLevelId) ??
        legacyServedLevels[0]?.id ??
        findLevelId(levels, node.defaultLevelId) ??
        levels[0]?.id ??
        '');
}
function getResolvedToLevelId(node, levels, fromLevelId) {
    if (!node)
        return levels[0]?.id ?? '';
    const explicitTo = findLevelId(levels, node.toLevelId);
    if (explicitTo)
        return explicitTo;
    const legacyServedLevels = getLegacyServedLevels(node, levels);
    const legacyTo = legacyServedLevels[legacyServedLevels.length - 1]?.id;
    if (legacyTo)
        return legacyTo;
    const fromIndex = levels.findIndex((level) => level.id === fromLevelId);
    const fallbackIndex = fromIndex >= 0 ? Math.min(fromIndex + 1, levels.length - 1) : 0;
    return levels[fallbackIndex]?.id ?? fromLevelId;
}
function getServiceLevels(levels, fromLevelId, toLevelId) {
    const fromIndex = levels.findIndex((level) => level.id === fromLevelId);
    const toIndex = levels.findIndex((level) => level.id === toLevelId);
    if (fromIndex < 0 && toIndex < 0)
        return [];
    const resolvedFromIndex = fromIndex >= 0 ? fromIndex : toIndex;
    const resolvedToIndex = toIndex >= 0 ? toIndex : Math.min(Math.max(resolvedFromIndex, 0) + 1, levels.length - 1);
    const minIndex = Math.min(resolvedFromIndex, resolvedToIndex);
    const maxIndex = Math.max(resolvedFromIndex, resolvedToIndex);
    return levels.slice(minIndex, maxIndex + 1);
}
function stripDuplicateFlags(metadata) {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
        return metadata;
    }
    const nextMeta = { ...metadata };
    delete nextMeta.isNew;
    delete nextMeta.isTransient;
    return nextMeta;
}
const DOOR_STYLE_OPTIONS = [
    { label: 'Center opening', value: 'center-opening' },
    { label: 'Single left', value: 'single-left' },
    { label: 'Single right', value: 'single-right' },
];
const DOOR_PANEL_STYLE_OPTIONS = [
    { label: 'Glass frame', value: 'glass-frame' },
    { label: 'Solid panel', value: 'solid-panel' },
    { label: 'Segmented panel', value: 'segmented-panel' },
];
const SHAFT_STYLE_OPTIONS = [
    { label: 'Solid', value: 'solid' },
    { label: 'Glass', value: 'glass' },
];
function roundMeters(value) {
    return Math.round(value * 100) / 100;
}
function getResolvedShaftWidth(node) {
    return Math.max(node.shaftWidth ?? node.width, node.width, 0.8);
}
function getResolvedShaftDepth(node) {
    return Math.max(node.shaftDepth ?? node.depth, node.depth, 0.8);
}
function getResolvedShaftWallThickness(node) {
    return Math.max(node.shaftWallThickness ?? 0.09, 0.04);
}
function radiansToDegrees(radians) {
    return Math.round((radians * 180) / Math.PI);
}
function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
export default function ElevatorPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const selectedCount = useViewer((s) => s.selection.selectedIds.length);
    const setSelection = useViewer((s) => s.setSelection);
    const updateNode = useScene((s) => s.updateNode);
    const createNode = useScene((s) => s.createNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const runtime = useInteractive(useShallow((s) => {
        const state = selectedId ? s.elevators[selectedId] : null;
        if (!state)
            return null;
        return {
            currentLevelId: state.currentLevelId,
            requestedStops: state.requestedStops,
            queue: state.queue,
            targetLevelId: state.targetLevelId,
        };
    }));
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    const liveOverrides = useLiveNodeOverrides((s) => selectedId ? s.get(selectedId) : undefined);
    const liveTransform = useLiveTransforms((s) => selectedId ? s.get(selectedId) : undefined);
    useEffect(() => {
        return () => {
            if (!selectedId)
                return;
            useLiveNodeOverrides.getState().clear(selectedId);
            useLiveTransforms.getState().clear(selectedId);
        };
    }, [selectedId]);
    const levels = useScene(useShallow((s) => {
        if (!(node?.parentId && s.nodes[node.parentId]?.type === 'building'))
            return [];
        const building = s.nodes[node.parentId];
        if (building?.type !== 'building')
            return [];
        return building.children
            .map((childId) => s.nodes[childId])
            .filter((entry) => entry?.type === 'level')
            .sort((left, right) => left.level - right.level);
    }));
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        updateNode(selectedId, updates);
    }, [selectedId, updateNode]);
    const clearLivePreview = useCallback(() => {
        if (!selectedId)
            return;
        useLiveNodeOverrides.getState().clear(selectedId);
        useLiveTransforms.getState().clear(selectedId);
    }, [selectedId]);
    useEffect(() => {
        if (!(selectedId && node?.type === 'elevator'))
            return;
        const supportY = resolveElevatorNodeSupportY(node);
        if (node.position[1] >= supportY - 1e-4)
            return;
        updateNode(selectedId, {
            position: [node.position[0], supportY, node.position[2]],
        });
    }, [
        node?.defaultLevelId,
        node?.fromLevelId,
        node?.id,
        node?.parentId,
        node?.position[0],
        node?.position[1],
        node?.position[2],
        node?.type,
        selectedId,
        updateNode,
        node,
    ]);
    const previewMetric = useCallback((key, value) => {
        if (!selectedId)
            return;
        useLiveNodeOverrides.getState().set(selectedId, { [key]: value });
    }, [selectedId]);
    const commitMetric = useCallback((key, value) => {
        if (!selectedId)
            return;
        const hasChange = !(node && Math.abs(Number(node[key]) - Number(value)) <= 1e-6);
        if (hasChange) {
            updateNode(selectedId, { [key]: value });
        }
        useLiveNodeOverrides.getState().clear(selectedId);
    }, [node, selectedId, updateNode]);
    const previewTransform = useCallback((position, rotation) => {
        if (!selectedId)
            return;
        useLiveTransforms.getState().set(selectedId, { position, rotation });
    }, [selectedId]);
    const commitTransform = useCallback((position, rotation) => {
        if (!(selectedId && node))
            return;
        useLiveTransforms.getState().clear(selectedId);
        const positionChanged = node.position.some((value, index) => Math.abs(value - position[index]) > 1e-6);
        const rotationChanged = Math.abs(node.rotation - rotation) > 1e-6;
        if (positionChanged || rotationChanged) {
            updateNode(selectedId, { position, rotation });
        }
    }, [node, selectedId, updateNode]);
    const getSupportedPosition = useCallback((x, z) => {
        if (!node)
            return [x, 0, z];
        const supportY = resolveElevatorSupportY({
            buildingId: node.parentId,
            preferredLevelId: node.fromLevelId ?? node.defaultLevelId,
            x,
            z,
        });
        return [x, supportY, z];
    }, [node]);
    const handleClose = useCallback(() => {
        clearLivePreview();
        setSelection({ selectedIds: [] });
    }, [clearLivePreview, setSelection]);
    const handleMove = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        clearLivePreview();
        setMovingNode(node);
        setSelection({ selectedIds: [] });
    }, [clearLivePreview, node, setMovingNode, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node?.parentId)
            return;
        triggerSFX('sfx:item-pick');
        const duplicate = ElevatorNodeSchema.parse({
            ...structuredClone(node),
            id: undefined,
            name: node.name ? `${node.name} Copy` : 'Elevator Copy',
            position: [node.position[0] + 1, node.position[1], node.position[2] + 1],
            metadata: { ...stripDuplicateFlags(node.metadata), isNew: true },
        });
        createNode(duplicate, node.parentId);
        clearLivePreview();
        setMovingNode(duplicate);
        setSelection({ selectedIds: [] });
    }, [clearLivePreview, node, createNode, setMovingNode, setSelection]);
    const handleDelete = useCallback(() => {
        if (!(selectedId && node))
            return;
        triggerSFX('sfx:structure-delete');
        clearLivePreview();
        useScene.getState().deleteNode(selectedId);
        setSelection({ selectedIds: [] });
    }, [clearLivePreview, selectedId, node, setSelection]);
    const requestLevel = useCallback((levelId) => {
        if (!node)
            return;
        if ((node.disabledLevelIds ?? []).includes(levelId))
            return;
        requestElevatorLevel(node.id, levelId);
    }, [node]);
    const toggleLevelAccess = useCallback((field, levelId) => {
        if (!node)
            return;
        const disabledIds = new Set(node.disabledLevelIds ?? []);
        const serviceOnlyIds = new Set(node.serviceOnlyLevelIds ?? []);
        const targetSet = field === 'disabledLevelIds' ? disabledIds : serviceOnlyIds;
        if (targetSet.has(levelId)) {
            targetSet.delete(levelId);
        }
        else {
            targetSet.add(levelId);
        }
        if (field === 'disabledLevelIds' && disabledIds.has(levelId)) {
            serviceOnlyIds.delete(levelId);
        }
        if (field === 'serviceOnlyLevelIds' && serviceOnlyIds.has(levelId)) {
            disabledIds.delete(levelId);
        }
        const nextServiceLevels = getServiceLevels(levels, getResolvedFromLevelId(node, levels), getResolvedToLevelId(node, levels, getResolvedFromLevelId(node, levels)));
        const nextDefaultLevelId = node.defaultLevelId && !disabledIds.has(node.defaultLevelId)
            ? node.defaultLevelId
            : (nextServiceLevels.find((level) => !disabledIds.has(level.id))?.id ??
                nextServiceLevels[0]?.id ??
                null);
        handleUpdate({
            defaultLevelId: nextDefaultLevelId,
            disabledLevelIds: Array.from(disabledIds),
            serviceOnlyLevelIds: Array.from(serviceOnlyIds),
        });
    }, [handleUpdate, levels, node]);
    const handleServiceBoundaryChange = useCallback((field, levelId) => {
        if (!node)
            return;
        const nextFromLevelId = field === 'fromLevelId' ? levelId : getResolvedFromLevelId(node, levels);
        const nextToLevelId = field === 'toLevelId' ? levelId : getResolvedToLevelId(node, levels, nextFromLevelId);
        const nextServedLevels = getServiceLevels(levels, nextFromLevelId, nextToLevelId);
        const currentDefaultIsServed = nextServedLevels.some((level) => level.id === node.defaultLevelId);
        handleUpdate({
            [field]: levelId || null,
            defaultLevelId: currentDefaultIsServed
                ? node.defaultLevelId
                : nextFromLevelId || nextServedLevels[0]?.id || null,
            ...(field === 'fromLevelId'
                ? {
                    position: [
                        node.position[0],
                        resolveElevatorSupportY({
                            buildingId: node.parentId,
                            preferredLevelId: nextFromLevelId,
                            x: node.position[0],
                            z: node.position[2],
                        }),
                        node.position[2],
                    ],
                }
                : {}),
            servedLevelIds: undefined,
        });
    }, [node, levels, handleUpdate]);
    if (!(node && node.type === 'elevator' && selectedId && selectedCount === 1))
        return null;
    const displayNode = liveOverrides ? { ...node, ...liveOverrides } : node;
    const displayPosition = liveTransform?.position ?? displayNode.position;
    const displayRotation = liveTransform?.rotation ?? displayNode.rotation;
    const displayRotationDegrees = radiansToDegrees(displayRotation);
    const displayShaftWidth = getResolvedShaftWidth(displayNode);
    const displayShaftDepth = getResolvedShaftDepth(displayNode);
    const displayShaftWallThickness = getResolvedShaftWallThickness(displayNode);
    const fromLevelId = getResolvedFromLevelId(node, levels);
    const toLevelId = getResolvedToLevelId(node, levels, fromLevelId);
    const servedLevels = getServiceLevels(levels, fromLevelId, toLevelId);
    const servedLevelIdSet = new Set(servedLevels.map((level) => level.id));
    const disabledLevelIds = new Set((node.disabledLevelIds ?? []).filter((levelId) => servedLevelIdSet.has(levelId)));
    const serviceOnlyLevelIds = new Set((node.serviceOnlyLevelIds ?? []).filter((levelId) => servedLevelIdSet.has(levelId)));
    const enabledServedLevels = servedLevels.filter((level) => !disabledLevelIds.has(level.id));
    const defaultLevelOptions = enabledServedLevels.length > 0
        ? enabledServedLevels
        : servedLevels.length > 0
            ? servedLevels
            : levels;
    const selectedDefaultLevelId = defaultLevelOptions.some((level) => level.id === node.defaultLevelId)
        ? (node.defaultLevelId ?? '')
        : fromLevelId;
    const activeLevelId = runtime?.currentLevelId ??
        (servedLevels.some((level) => level.id === node.defaultLevelId)
            ? node.defaultLevelId
            : fromLevelId || levels[0]?.id) ??
        null;
    const destinationOrderByLevelId = new Map();
    for (const [index, levelId] of (runtime?.requestedStops ?? []).entries()) {
        destinationOrderByLevelId.set(levelId, index + 1);
    }
    return (_jsxs(PanelWrapper, { icon: "/icons/elevator.png", onClose: handleClose, title: node.name || 'Elevator', width: 300, children: [_jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "text-destructive hover:text-destructive", icon: _jsx(Trash2, { className: "h-3.5 w-3.5" }), label: "Delete", onClick: handleDelete })] }) }), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: "X", max: 50, min: -50, onChange: (value) => {
                            const position = getSupportedPosition(value, displayPosition[2]);
                            previewTransform(position, displayRotation);
                        }, onCommit: (value) => {
                            const position = getSupportedPosition(value, displayPosition[2]);
                            commitTransform(position, displayRotation);
                        }, precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: roundMeters(displayPosition[0]) }), _jsx(SliderControl, { label: "Y", max: 50, min: -50, onChange: (value) => {
                            const position = [
                                displayPosition[0],
                                value,
                                displayPosition[2],
                            ];
                            previewTransform(position, displayRotation);
                        }, onCommit: (value) => {
                            const position = [
                                displayPosition[0],
                                value,
                                displayPosition[2],
                            ];
                            commitTransform(position, displayRotation);
                        }, precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: roundMeters(displayPosition[1]) }), _jsx(SliderControl, { label: "Z", max: 50, min: -50, onChange: (value) => {
                            const position = getSupportedPosition(displayPosition[0], value);
                            previewTransform(position, displayRotation);
                        }, onCommit: (value) => {
                            const position = getSupportedPosition(displayPosition[0], value);
                            commitTransform(position, displayRotation);
                        }, precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: roundMeters(displayPosition[2]) })] }), _jsxs(PanelSection, { title: "Rotation", children: [_jsx(SliderControl, { label: "Yaw", max: 180, min: -180, onChange: (degrees) => previewTransform(displayPosition, degreesToRadians(degrees)), onCommit: (degrees) => commitTransform(displayPosition, degreesToRadians(degrees)), precision: 0, restoreOnCommit: false, step: 1, unit: "\u00B0", value: displayRotationDegrees }), _jsxs("div", { className: "flex gap-1.5 px-1 pt-2 pb-1", children: [_jsx(ActionButton, { label: "-45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    commitTransform(displayPosition, displayRotation - Math.PI / 4);
                                } }), _jsx(ActionButton, { label: "+45\u00B0", onClick: () => {
                                    triggerSFX('sfx:item-rotate');
                                    commitTransform(displayPosition, displayRotation + Math.PI / 4);
                                } })] })] }), _jsxs(PanelSection, { title: "Service", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "From" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-2 text-sm text-foreground", onChange: (event) => handleServiceBoundaryChange('fromLevelId', event.target.value), value: fromLevelId, children: levels.map((level) => (_jsx("option", { value: level.id, children: level.name || `Level ${level.level}` }, level.id))) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "To" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-2 text-sm text-foreground", onChange: (event) => handleServiceBoundaryChange('toLevelId', event.target.value), value: toLevelId, children: levels.map((level) => (_jsx("option", { value: level.id, children: level.name || `Level ${level.level}` }, level.id))) })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Default Floor" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-3 text-sm text-foreground", onChange: (event) => handleUpdate({ defaultLevelId: event.target.value || null }), value: selectedDefaultLevelId, children: defaultLevelOptions.map((level) => (_jsx("option", { value: level.id, children: level.name || `Level ${level.level}` }, level.id))) })] })] }), _jsxs(PanelSection, { title: "Cab", children: [_jsx(MetricControl, { label: "Width", max: 4, min: 0.8, onChange: (value) => previewMetric('width', value), onCommit: (value) => commitMetric('width', value), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayNode.width }), _jsx(MetricControl, { label: "Depth", max: 4, min: 0.8, onChange: (value) => previewMetric('depth', value), onCommit: (value) => commitMetric('depth', value), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayNode.depth }), _jsx(MetricControl, { label: "Cab Height", max: 4, min: 1.8, onChange: (value) => previewMetric('cabHeight', value), onCommit: (value) => commitMetric('cabHeight', value), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayNode.cabHeight })] }), _jsxs(PanelSection, { title: "Shaft", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Shaft Style" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-3 text-sm text-foreground", onChange: (event) => handleUpdate({ shaftStyle: event.target.value }), value: displayNode.shaftStyle ?? 'solid', children: SHAFT_STYLE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsx(MetricControl, { label: "Shaft Width", max: 5, min: displayNode.width, onChange: (value) => previewMetric('shaftWidth', Math.max(value, displayNode.width)), onCommit: (value) => commitMetric('shaftWidth', Math.max(value, displayNode.width)), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayShaftWidth }), _jsx(MetricControl, { label: "Shaft Depth", max: 5, min: displayNode.depth, onChange: (value) => previewMetric('shaftDepth', Math.max(value, displayNode.depth)), onCommit: (value) => commitMetric('shaftDepth', Math.max(value, displayNode.depth)), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayShaftDepth }), _jsx(MetricControl, { label: "Wall Thickness", max: 0.4, min: 0.04, onChange: (value) => previewMetric('shaftWallThickness', value), onCommit: (value) => commitMetric('shaftWallThickness', value), precision: 2, restoreOnCommit: false, step: 0.01, unit: "m", value: displayShaftWallThickness })] }), _jsxs(PanelSection, { title: "Doors", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Opening Style" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-3 text-sm text-foreground", onChange: (event) => handleUpdate({ doorStyle: event.target.value }), value: displayNode.doorStyle ?? 'center-opening', children: DOOR_STYLE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Door Type" }), _jsx("select", { className: "h-9 w-full rounded-lg border border-border/50 bg-[#2C2C2E] px-3 text-sm text-foreground", onChange: (event) => handleUpdate({
                                    doorPanelStyle: event.target.value,
                                }), value: displayNode.doorPanelStyle ?? 'glass-frame', children: DOOR_PANEL_STYLE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsx(MetricControl, { label: "Door Width", max: Math.max(displayNode.width - 0.1, 0.5), min: 0.45, onChange: (value) => previewMetric('doorWidth', value), onCommit: (value) => commitMetric('doorWidth', value), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayNode.doorWidth }), _jsx(MetricControl, { label: "Door Height", max: Math.max(displayNode.cabHeight - 0.1, 1.3), min: 1.2, onChange: (value) => previewMetric('doorHeight', value), onCommit: (value) => commitMetric('doorHeight', value), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: displayNode.doorHeight })] }), _jsx(PanelSection, { title: "Access", children: _jsx("div", { className: "space-y-2", children: servedLevels.map((level) => {
                        const isDisabled = disabledLevelIds.has(level.id);
                        const isServiceOnly = serviceOnlyLevelIds.has(level.id);
                        return (_jsxs("div", { className: "flex items-center justify-between gap-2 rounded-lg border border-border/45 bg-[#2C2C2E] px-2.5 py-2", children: [_jsx("span", { className: "min-w-0 truncate text-sm", children: level.name || `Level ${level.level}` }), _jsxs("div", { className: "flex shrink-0 gap-1.5", children: [_jsx("button", { className: `rounded-md border px-2 py-1 text-[11px] transition-colors ${isServiceOnly
                                                ? 'border-sky-300/45 bg-sky-400/15 text-sky-100'
                                                : 'border-border/50 bg-black/15 text-muted-foreground hover:text-foreground'} ${isDisabled ? 'cursor-not-allowed opacity-45' : ''}`, disabled: isDisabled, onClick: () => toggleLevelAccess('serviceOnlyLevelIds', level.id), type: "button", children: "Service" }), _jsx("button", { className: `rounded-md border px-2 py-1 text-[11px] transition-colors ${isDisabled
                                                ? 'border-red-300/45 bg-red-400/15 text-red-100'
                                                : 'border-border/50 bg-black/15 text-muted-foreground hover:text-foreground'}`, onClick: () => toggleLevelAccess('disabledLevelIds', level.id), type: "button", children: "Disabled" })] })] }, level.id));
                    }) }) }), _jsx(PanelSection, { title: "Destination", children: _jsx("div", { className: "grid grid-cols-2 gap-1.5", children: servedLevels.map((level) => {
                        const isActive = activeLevelId === level.id;
                        const stopOrder = destinationOrderByLevelId.get(level.id);
                        const isDisabled = disabledLevelIds.has(level.id);
                        const isServiceOnly = serviceOnlyLevelIds.has(level.id);
                        return (_jsxs("button", { className: `flex min-h-11 items-center justify-between gap-2 rounded-lg border px-2.5 text-left transition-colors ${isDisabled
                                ? 'cursor-not-allowed border-border/35 bg-[#202024] text-muted-foreground/55'
                                : isActive
                                    ? 'border-emerald-400/45 bg-emerald-400/15 text-emerald-100'
                                    : 'border-border/50 bg-[#2C2C2E] text-foreground hover:bg-[#3e3e3e]'}`, disabled: isDisabled, onClick: () => requestLevel(level.id), type: "button", children: [_jsxs("span", { className: "flex min-w-0 flex-col", children: [_jsx("span", { className: "truncate text-xs", children: level.name || `Level ${level.level}` }), isDisabled ? (_jsx("span", { className: "mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-current/65", children: "Disabled" })) : isServiceOnly ? (_jsx("span", { className: "mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-current/65", children: "Service" })) : (stopOrder && (_jsxs("span", { className: "mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-current/65", children: ["Stop ", stopOrder] })))] }), _jsx("span", { className: `flex h-6 min-w-6 items-center justify-center rounded-full border border-white/15 bg-black/20 ${stopOrder ? 'px-1.5 font-mono text-[11px] font-semibold' : ''}`, children: isDisabled ? '×' : (stopOrder ?? _jsx(Send, { className: "h-3 w-3" })) })] }, level.id));
                    }) }) }), _jsxs(PanelSection, { title: "Motion", children: [_jsx(SliderControl, { label: "Speed", max: 8, min: 0.5, onChange: (value) => handleUpdate({ speed: value }), precision: 1, step: 0.1, unit: "m/s", value: node.speed }), _jsx(SliderControl, { label: "Door Time", max: 2200, min: 300, onChange: (value) => handleUpdate({ doorDurationMs: value }), step: 50, unit: "ms", value: node.doorDurationMs }), _jsx(SliderControl, { label: "Dwell", max: 5000, min: 300, onChange: (value) => handleUpdate({ dwellMs: value }), step: 100, unit: "ms", value: node.dwellMs })] })] }));
}
