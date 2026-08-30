'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useInteractive, useScene, WindowNode, } from '@pascal-app/core';
import { ActionButton, ActionGroup, cn, PanelSection, PanelWrapper, SegmentedControl, SliderControl, ToggleControl, triggerSFX, useEditor, } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { Copy, FlipHorizontal2, Move, Trash2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
function isSameWindowValue(current, next) {
    if (typeof current === 'number' && typeof next === 'number') {
        return Math.abs(current - next) < 1e-6;
    }
    if (Array.isArray(current) && Array.isArray(next)) {
        return (current.length === next.length &&
            current.every((value, index) => isSameWindowValue(value, next[index])));
    }
    return Object.is(current, next);
}
function getMaxSharedWindowRadius(width, height) {
    return Math.max(0, Math.min(width / 2, height / 2));
}
function normalizeWindowCornerRadii(radii, width, height) {
    const next = radii.map((radius) => Math.max(radius, 0));
    const scale = Math.min(1, Math.max(width, 0) / Math.max(next[0] + next[1], 1e-6), Math.max(width, 0) / Math.max(next[3] + next[2], 1e-6), Math.max(height, 0) / Math.max(next[0] + next[3], 1e-6), Math.max(height, 0) / Math.max(next[1] + next[2], 1e-6));
    if (scale >= 1)
        return next;
    return next.map((radius) => radius * scale);
}
function isSameRadiusTuple(current, next) {
    return current.every((value, index) => Math.abs(value - (next[index] ?? 0)) < 1e-6);
}
const windowTypeOptions = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Sliding', value: 'sliding' },
    { label: 'Casement', value: 'casement' },
    { label: 'Awning', value: 'awning' },
    { label: 'Single Hung', value: 'single-hung' },
    { label: 'Double Hung', value: 'double-hung' },
    { label: 'Bay', value: 'bay' },
    { label: 'Bow', value: 'bow' },
    { label: 'Louvered', value: 'louvered' },
];
const shapedWindowTypes = new Set([
    'fixed',
    'casement',
    'awning',
    'hopper',
    'louvered',
]);
const silllessWindowTypes = new Set(['bay', 'bow']);
export default function WindowPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const deleteNode = useScene((s) => s.deleteNode);
    const setMovingNode = useEditor((s) => s.setMovingNode);
    const previewRef = useRef(null);
    const node = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    // Panel slider-drag fix recipe (plans/editor-node-registry.md). Without
    // it, the 15+ SliderControls in this panel would loop on drag.
    const handleUpdate = useCallback((updates) => {
        if (!selectedId)
            return;
        const liveNode = useScene.getState().nodes[selectedId];
        if (liveNode?.type !== 'window')
            return;
        const hasChange = Object.entries(updates).some(([key, value]) => {
            const currentValue = liveNode[key];
            return !isSameWindowValue(currentValue, value);
        });
        if (!hasChange)
            return;
        useScene.getState().updateNode(selectedId, updates);
        const scene = useScene.getState();
        scene.dirtyNodes.add(selectedId);
        if (liveNode.parentId)
            scene.dirtyNodes.add(liveNode.parentId);
    }, [selectedId]);
    const previewWindowUpdate = useCallback((key, value) => {
        if (!selectedId)
            return;
        const liveNode = useScene.getState().nodes[selectedId];
        if (liveNode?.type !== 'window')
            return;
        if (!(previewRef.current &&
            previewRef.current.id === selectedId &&
            previewRef.current.key === key)) {
            previewRef.current = {
                id: selectedId,
                key,
                value: liveNode[key],
            };
        }
        if (isSameWindowValue(liveNode[key], value))
            return;
        liveNode[key] = value;
        useScene.getState().dirtyNodes.add(selectedId);
    }, [selectedId]);
    const commitWindowPreview = useCallback((key, value) => {
        if (!selectedId)
            return;
        const scene = useScene.getState();
        const liveNode = scene.nodes[selectedId];
        const preview = previewRef.current;
        if (liveNode?.type === 'window' && preview?.id === selectedId && preview.key === key) {
            ;
            liveNode[key] = preview.value;
            scene.dirtyNodes.add(selectedId);
        }
        previewRef.current = null;
        useScene.getState().updateNode(selectedId, {
            [key]: value,
        });
        scene.dirtyNodes.add(selectedId);
    }, [selectedId]);
    const handleClose = useCallback(() => {
        setSelection({ selectedIds: [] });
    }, [setSelection]);
    const handleFlip = useCallback(() => {
        if (!node)
            return;
        handleUpdate({
            side: node.side === 'front' ? 'back' : 'front',
            rotation: [node.rotation[0], node.rotation[1] + Math.PI, node.rotation[2]],
        });
    }, [node, handleUpdate]);
    const handleMove = useCallback(() => {
        if (!node)
            return;
        triggerSFX('sfx:item-pick');
        setMovingNode(node);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    const handleDelete = useCallback(() => {
        if (!(selectedId && node))
            return;
        triggerSFX('sfx:item-delete');
        deleteNode(selectedId);
        if (node.parentId)
            useScene.getState().dirtyNodes.add(node.parentId);
        setSelection({ selectedIds: [] });
    }, [selectedId, node, deleteNode, setSelection]);
    const handleDuplicate = useCallback(() => {
        if (!node?.parentId)
            return;
        triggerSFX('sfx:item-pick');
        useScene.temporal.getState().pause();
        const duplicate = WindowNode.parse({
            position: [...node.position],
            rotation: [...node.rotation],
            side: node.side,
            wallId: node.wallId,
            parentId: node.parentId,
            width: node.width,
            height: node.height,
            windowType: node.windowType,
            operationState: node.operationState,
            awningDirection: node.awningDirection,
            casementStyle: node.casementStyle,
            hingesSide: node.hingesSide,
            frameThickness: node.frameThickness,
            frameDepth: node.frameDepth,
            openingKind: node.openingKind,
            openingShape: node.openingShape,
            openingRadiusMode: node.openingRadiusMode ?? 'all',
            openingCornerRadii: [...(node.openingCornerRadii ?? [0.15, 0.15, 0.15, 0.15])],
            cornerRadius: node.cornerRadius,
            archHeight: node.archHeight,
            openingRevealRadius: node.openingRevealRadius,
            columnRatios: [...node.columnRatios],
            rowRatios: [...node.rowRatios],
            columnDividerThickness: node.columnDividerThickness,
            rowDividerThickness: node.rowDividerThickness,
            sill: node.sill,
            sillDepth: node.sillDepth,
            sillThickness: node.sillThickness,
            metadata: { isNew: true },
        });
        useScene.getState().createNode(duplicate, node.parentId);
        setMovingNode(duplicate);
        setSelection({ selectedIds: [] });
    }, [node, setMovingNode, setSelection]);
    if (!(node && node.type === 'window' && selectedId))
        return null;
    const numCols = node.columnRatios.length;
    const numRows = node.rowRatios.length;
    const colSum = node.columnRatios.reduce((a, b) => a + b, 0);
    const rowSum = node.rowRatios.reduce((a, b) => a + b, 0);
    const normCols = node.columnRatios.map((r) => r / colSum);
    const normRows = node.rowRatios.map((r) => r / rowSum);
    const isOpening = node.openingKind === 'opening';
    const openingShape = node.openingShape ?? 'rectangle';
    const windowShape = openingShape === 'arch' || openingShape === 'rounded' ? openingShape : 'rectangle';
    const openingRadiusMode = node.openingRadiusMode ?? 'all';
    const openingCornerRadii = node.openingCornerRadii ?? [0.15, 0.15, 0.15, 0.15];
    const cornerRadius = node.cornerRadius ?? 0.15;
    const archHeight = node.archHeight ?? 0.35;
    const openingRevealRadius = node.openingRevealRadius ?? 0.025;
    const maxRoundedRadius = Math.max(0.01, getMaxSharedWindowRadius(node.width, node.height));
    const displayedWindowType = node.windowType === 'hopper' ? 'awning' : (node.windowType ?? 'fixed');
    const awningDirection = node.windowType === 'hopper' ? 'down' : (node.awningDirection ?? 'up');
    const windowType = node.windowType ?? 'fixed';
    const isFixedWindow = windowType === 'fixed';
    const isTrackSashWindow = windowType === 'sliding' || windowType === 'single-hung' || windowType === 'double-hung';
    const isOperableSashWindow = windowType === 'casement' ||
        windowType === 'awning' ||
        windowType === 'hopper' ||
        windowType === 'louvered';
    const isOperableWindow = isTrackSashWindow || isOperableSashWindow;
    const supportsWindowShape = shapedWindowTypes.has(node.windowType ?? 'fixed');
    const supportsGrid = isFixedWindow;
    const supportsSill = !silllessWindowTypes.has(node.windowType);
    const showWindowTypeSection = !isOpening;
    const showWindowShapeSection = !isOpening && supportsWindowShape;
    const showOpeningShapeSection = isOpening;
    const showFrameSection = !isOpening;
    const showGridSection = !isOpening && supportsGrid;
    const showSillSection = !isOpening && supportsSill;
    const showOperationSection = !isOpening && isOperableWindow;
    const showAwningDirectionSection = !isOpening && displayedWindowType === 'awning';
    const showCasementSection = !isOpening && windowType === 'casement';
    const showFlipSide = !isOpening;
    const operationLabel = isTrackSashWindow
        ? windowType === 'sliding'
            ? 'Slide'
            : 'Raise'
        : windowType === 'casement'
            ? 'Swing'
            : windowType === 'louvered'
                ? 'Slats'
                : 'Tilt';
    const setOperationState = (value) => {
        useInteractive.getState().cancelWindowAnimation(node.id);
        useInteractive.getState().removeWindowOpenState(node.id);
        handleUpdate({ operationState: Math.max(0, Math.min(1, value)) });
    };
    const getDimensionUpdates = (updates) => {
        const nextWidth = updates.width ?? node.width;
        const nextHeight = updates.height ?? node.height;
        const nextUpdates = { ...updates };
        if (openingShape === 'rounded') {
            if (openingRadiusMode === 'individual') {
                const currentRadii = openingCornerRadii;
                const nextRadii = normalizeWindowCornerRadii(openingCornerRadii, nextWidth, nextHeight);
                if (!isSameRadiusTuple(currentRadii, nextRadii)) {
                    nextUpdates.openingCornerRadii = nextRadii;
                }
            }
            else {
                const nextRadius = Math.min(Math.max(cornerRadius, 0), getMaxSharedWindowRadius(nextWidth, nextHeight));
                if (Math.abs(nextRadius - cornerRadius) > 1e-6) {
                    nextUpdates.cornerRadius = nextRadius;
                }
            }
        }
        if (openingShape === 'arch') {
            const nextArchHeight = Math.min(Math.max(archHeight, 0.05), Math.max(nextHeight, 0.05));
            if (Math.abs(nextArchHeight - archHeight) > 1e-6) {
                nextUpdates.archHeight = nextArchHeight;
            }
        }
        return nextUpdates;
    };
    const setOpeningCornerRadius = (index, value, commit = false) => {
        const next = [...openingCornerRadii];
        next[index] = value;
        if (commit) {
            commitWindowPreview('openingCornerRadii', next);
        }
        else {
            previewWindowUpdate('openingCornerRadii', next);
        }
    };
    const setColumnRatio = (index, newVal) => {
        const clamped = Math.max(0.05, Math.min(0.95, newVal));
        const neighborIdx = index < numCols - 1 ? index + 1 : index - 1;
        const delta = clamped - normCols[index];
        const neighborVal = Math.max(0.05, normCols[neighborIdx] - delta);
        const newRatios = normCols.map((v, i) => {
            if (i === index)
                return clamped;
            if (i === neighborIdx)
                return neighborVal;
            return v;
        });
        handleUpdate({ columnRatios: newRatios });
    };
    const setRowRatio = (index, newVal) => {
        const clamped = Math.max(0.05, Math.min(0.95, newVal));
        const neighborIdx = index < numRows - 1 ? index + 1 : index - 1;
        const delta = clamped - normRows[index];
        const neighborVal = Math.max(0.05, normRows[neighborIdx] - delta);
        const newRatios = normRows.map((v, i) => {
            if (i === index)
                return clamped;
            if (i === neighborIdx)
                return neighborVal;
            return v;
        });
        handleUpdate({ rowRatios: newRatios });
    };
    return (_jsxs(PanelWrapper, { icon: "/icons/window.png", onClose: handleClose, title: node.name || 'Window', width: 320, children: [_jsx(PanelSection, { title: "Type", children: _jsx(SegmentedControl, { onChange: (value) => handleUpdate({
                        openingKind: value,
                        ...(value === 'opening'
                            ? {
                                openingShape,
                                openingRadiusMode,
                                openingCornerRadii,
                                cornerRadius,
                                archHeight,
                                openingRevealRadius,
                            }
                            : {}),
                    }), options: [
                        { value: 'window', label: 'Window' },
                        { value: 'opening', label: 'Opening' },
                    ], value: node.openingKind ?? 'window' }) }), showWindowTypeSection && (_jsxs(PanelSection, { title: "Window Type", children: [_jsx("div", { className: "grid grid-cols-2 gap-2 px-1 pt-1", children: windowTypeOptions.map((option) => {
                            const isSelected = displayedWindowType === option.value;
                            return (_jsx("button", { className: cn('flex min-h-12 items-center rounded-lg border px-3 py-2.5 text-left text-xs transition-colors', isSelected
                                    ? 'border-orange-400/60 bg-orange-400/10 text-foreground'
                                    : 'border-border/50 bg-[#2C2C2E] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground'), onClick: () => handleUpdate({
                                    windowType: option.value,
                                    ...(option.value === 'awning' ? { awningDirection } : {}),
                                    ...(!shapedWindowTypes.has(option.value)
                                        ? { openingShape: 'rectangle' }
                                        : {}),
                                    ...(silllessWindowTypes.has(option.value) ? { sill: false } : {}),
                                }), type: "button", children: _jsx("span", { className: "truncate font-medium", children: option.label }) }, option.value));
                        }) }), showAwningDirectionSection && (_jsx("div", { className: "mt-2", children: _jsx(SegmentedControl, { onChange: (value) => handleUpdate({
                                windowType: 'awning',
                                awningDirection: value,
                            }), options: [
                                { value: 'up', label: 'Up' },
                                { value: 'down', label: 'Down' },
                            ], value: awningDirection }) })), showCasementSection && (_jsxs("div", { className: "mt-2 space-y-2", children: [_jsx(SegmentedControl, { onChange: (value) => handleUpdate({ casementStyle: value }), options: [
                                    { value: 'single', label: 'Single' },
                                    { value: 'french', label: 'French' },
                                ], value: node.casementStyle ?? 'single' }), (node.casementStyle ?? 'single') === 'single' && (_jsx(SegmentedControl, { onChange: (value) => handleUpdate({ hingesSide: value }), options: [
                                    { value: 'left', label: 'Left' },
                                    { value: 'right', label: 'Right' },
                                ], value: node.hingesSide ?? 'left' }))] })), showOperationSection && (_jsx("div", { className: "mt-2", children: _jsx(SliderControl, { label: operationLabel, max: 1, min: 0, onChange: setOperationState, precision: 2, restoreOnCommit: false, step: 0.05, value: Math.round((node.operationState ?? 0) * 100) / 100 }) }))] })), _jsxs(PanelSection, { title: "Position", children: [_jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["X", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "pos" })] }), onChange: (v) => handleUpdate({ position: [v, node.position[1], node.position[2]] }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.position[0] * 100) / 100 }), _jsx(SliderControl, { label: _jsxs(_Fragment, { children: ["Y", _jsx("sub", { className: "ml-[1px] text-[11px] opacity-70", children: "pos" })] }), onChange: (v) => handleUpdate({ position: [node.position[0], v, node.position[2]] }), precision: 2, step: 0.1, unit: "m", value: Math.round(node.position[1] * 100) / 100 }), showFlipSide && (_jsx("div", { className: "px-1 pt-2 pb-1", children: _jsx(ActionButton, { className: "w-full", icon: _jsx(FlipHorizontal2, { className: "h-4 w-4" }), label: "Flip Side", onClick: handleFlip }) }))] }), _jsxs(PanelSection, { title: "Dimensions", children: [_jsx(SliderControl, { label: "Width", min: 0, onChange: (v) => handleUpdate(getDimensionUpdates({ width: v })), precision: 2, restoreOnCommit: false, step: 0.1, unit: "m", value: Math.round(node.width * 100) / 100 }), _jsx(SliderControl, { label: "Height", min: 0, onChange: (v) => handleUpdate(getDimensionUpdates({ height: v })), precision: 2, restoreOnCommit: false, step: 0.1, unit: "m", value: Math.round(node.height * 100) / 100 })] }), showWindowShapeSection && (_jsxs(PanelSection, { title: "Top Shape", children: [_jsx(SegmentedControl, { onChange: (value) => handleUpdate({
                            openingShape: value,
                            ...(value === 'rounded'
                                ? {
                                    openingRadiusMode,
                                    openingCornerRadii,
                                    cornerRadius: Math.min(cornerRadius, maxRoundedRadius),
                                    openingRevealRadius,
                                    sill: false,
                                }
                                : {}),
                            ...(value === 'arch' ? { archHeight } : {}),
                        }), options: [
                            { value: 'rectangle', label: 'Rect' },
                            { value: 'rounded', label: 'Rounded' },
                            { value: 'arch', label: 'Arch' },
                        ], value: windowShape }), windowShape === 'rounded' && (_jsxs("div", { className: "mt-2 flex flex-col gap-1", children: [_jsx(SegmentedControl, { onChange: (value) => handleUpdate({ openingRadiusMode: value }), options: [
                                    { value: 'all', label: 'All' },
                                    { value: 'individual', label: 'Individual' },
                                ], value: openingRadiusMode }), openingRadiusMode === 'all' ? (_jsx(SliderControl, { label: "Corner Radius", max: maxRoundedRadius, min: 0, onChange: (value) => previewWindowUpdate('cornerRadius', value), onCommit: (value) => commitWindowPreview('cornerRadius', value), precision: 2, step: 0.05, unit: "m", value: Math.round(cornerRadius * 100) / 100 })) : (_jsx(_Fragment, { children: [
                                    ['Top Left', 0],
                                    ['Top Right', 1],
                                    ['Bottom Right', 2],
                                    ['Bottom Left', 3],
                                ].map(([label, index]) => (_jsx(SliderControl, { label: label, max: maxRoundedRadius, min: 0, onChange: (value) => setOpeningCornerRadius(index, value), onCommit: (value) => setOpeningCornerRadius(index, value, true), precision: 2, step: 0.05, unit: "m", value: Math.round((openingCornerRadii[index] ?? 0) * 100) / 100 }, label))) })), _jsx(SliderControl, { label: "Reveal Radius", max: 0.08, min: 0, onChange: (value) => previewWindowUpdate('openingRevealRadius', value), onCommit: (value) => commitWindowPreview('openingRevealRadius', value), precision: 3, step: 0.005, unit: "m", value: Math.round(openingRevealRadius * 1000) / 1000 })] })), windowShape === 'arch' && (_jsx("div", { className: "mt-2 flex flex-col gap-1", children: _jsx(SliderControl, { label: "Arch Height", max: Math.max(0.05, node.height), min: 0.05, onChange: (value) => handleUpdate({ archHeight: value }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(archHeight * 100) / 100 }) }))] })), showOpeningShapeSection && (_jsxs(PanelSection, { title: "Opening Shape", children: [_jsx(SegmentedControl, { onChange: (value) => handleUpdate({ openingShape: value }), options: [
                            { value: 'rectangle', label: 'Rect' },
                            { value: 'rounded', label: 'Rounded' },
                            { value: 'arch', label: 'Arch' },
                        ], value: openingShape }), openingShape === 'rounded' && (_jsxs("div", { className: "mt-2 flex flex-col gap-1", children: [_jsx(SegmentedControl, { onChange: (value) => handleUpdate({ openingRadiusMode: value }), options: [
                                    { value: 'all', label: 'All' },
                                    { value: 'individual', label: 'Individual' },
                                ], value: openingRadiusMode }), openingRadiusMode === 'all' ? (_jsx(SliderControl, { label: "Corner Radius", max: maxRoundedRadius, min: 0, onChange: (value) => previewWindowUpdate('cornerRadius', value), onCommit: (value) => commitWindowPreview('cornerRadius', value), precision: 2, step: 0.05, unit: "m", value: Math.round(cornerRadius * 100) / 100 })) : (_jsx(_Fragment, { children: [
                                    ['Top Left', 0],
                                    ['Top Right', 1],
                                    ['Bottom Right', 2],
                                    ['Bottom Left', 3],
                                ].map(([label, index]) => (_jsx(SliderControl, { label: label, max: maxRoundedRadius, min: 0, onChange: (value) => setOpeningCornerRadius(index, value), onCommit: (value) => setOpeningCornerRadius(index, value, true), precision: 2, step: 0.05, unit: "m", value: Math.round((openingCornerRadii[index] ?? 0) * 100) / 100 }, label))) })), _jsx(SliderControl, { label: "Reveal Radius", max: 0.08, min: 0, onChange: (value) => previewWindowUpdate('openingRevealRadius', value), onCommit: (value) => commitWindowPreview('openingRevealRadius', value), precision: 3, step: 0.005, unit: "m", value: Math.round(openingRevealRadius * 1000) / 1000 })] })), openingShape === 'arch' && (_jsx("div", { className: "mt-2 flex flex-col gap-1", children: _jsx(SliderControl, { label: "Arch Height", max: Math.max(0.05, node.height), min: 0.05, onChange: (value) => handleUpdate({ archHeight: value }), precision: 2, restoreOnCommit: false, step: 0.05, unit: "m", value: Math.round(archHeight * 100) / 100 }) }))] })), !isOpening && (_jsxs(_Fragment, { children: [showFrameSection && (_jsxs(PanelSection, { title: "Frame", children: [_jsx(SliderControl, { label: "Thickness", min: 0, onChange: (v) => handleUpdate({ frameThickness: v }), precision: 3, step: 0.01, unit: "m", value: Math.round(node.frameThickness * 1000) / 1000 }), _jsx(SliderControl, { label: "Depth", min: 0, onChange: (v) => handleUpdate({ frameDepth: v }), precision: 3, step: 0.01, unit: "m", value: Math.round(node.frameDepth * 1000) / 1000 })] })), showGridSection && (_jsxs(PanelSection, { title: "Grid", children: [_jsx(SliderControl, { label: "Columns", max: 8, min: 1, onChange: (v) => {
                                    const n = Math.max(1, Math.min(8, Math.round(v)));
                                    handleUpdate({ columnRatios: Array(n).fill(1 / n) });
                                }, precision: 0, step: 1, value: numCols }), _jsx(SliderControl, { label: "Rows", max: 8, min: 1, onChange: (v) => {
                                    const n = Math.max(1, Math.min(8, Math.round(v)));
                                    handleUpdate({ rowRatios: Array(n).fill(1 / n) });
                                }, precision: 0, step: 1, value: numRows }), numCols > 1 && (_jsxs("div", { className: "mt-2 flex flex-col gap-1", children: [_jsx("div", { className: "mb-1 px-1 font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider", children: "Col Widths" }), normCols.map((ratio, i) => (_jsx(SliderControl, { label: `C${i + 1}`, max: 95, min: 5, onChange: (v) => setColumnRatio(i, v / 100), precision: 1, step: 1, unit: "%", value: Math.round(ratio * 100 * 10) / 10 }, `c-${i}`))), _jsx("div", { className: "mt-1 border-border/50 border-t pt-1", children: _jsx(SliderControl, { label: "Divider", max: 0.1, min: 0.005, onChange: (v) => handleUpdate({ columnDividerThickness: v }), precision: 3, step: 0.01, unit: "m", value: Math.round((node.columnDividerThickness ?? 0.03) * 1000) / 1000 }) })] })), numRows > 1 && (_jsxs("div", { className: "mt-2 flex flex-col gap-1", children: [_jsx("div", { className: "mb-1 px-1 font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider", children: "Row Heights" }), normRows.map((ratio, i) => (_jsx(SliderControl, { label: `R${i + 1}`, max: 95, min: 5, onChange: (v) => setRowRatio(i, v / 100), precision: 1, step: 1, unit: "%", value: Math.round(ratio * 100 * 10) / 10 }, `r-${i}`))), _jsx("div", { className: "mt-1 border-border/50 border-t pt-1", children: _jsx(SliderControl, { label: "Divider", max: 0.1, min: 0.005, onChange: (v) => handleUpdate({ rowDividerThickness: v }), precision: 3, step: 0.01, unit: "m", value: Math.round((node.rowDividerThickness ?? 0.03) * 1000) / 1000 }) })] }))] })), showSillSection && (_jsxs(PanelSection, { title: "Sill", children: [_jsx(ToggleControl, { checked: node.sill, label: "Enable Sill", onChange: (checked) => handleUpdate({ sill: checked }) }), node.sill && (_jsxs("div", { className: "mt-1 flex flex-col gap-1", children: [_jsx(SliderControl, { label: "Depth", min: 0, onChange: (v) => handleUpdate({ sillDepth: v }), precision: 3, step: 0.01, unit: "m", value: Math.round(node.sillDepth * 1000) / 1000 }), _jsx(SliderControl, { label: "Thickness", min: 0, onChange: (v) => handleUpdate({ sillThickness: v }), precision: 3, step: 0.01, unit: "m", value: Math.round(node.sillThickness * 1000) / 1000 })] }))] }))] })), _jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: handleMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: handleDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: handleDelete })] }) })] }));
}
