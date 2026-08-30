'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DownspoutNode, generateId, useScene, } from '@pascal-app/core';
import { ActionButton, ActionGroup, PanelSection, triggerSFX } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useShallow } from 'zustand/react/shallow';
import { computeEaveY } from './eave-snap';
import { resolveGutterOutletById } from './outlet-lookup';
const DEFAULT_OUTLET_DIAMETER = 0.07;
/**
 * Pick an along-length offset for a new outlet that doesn't land on an
 * existing one: the first goes near the right end, the rest drop into
 * the midpoint of the widest gap (including the gaps to each end). So
 * "Add Downspout" repeatedly spreads outlets along the run instead of
 * stacking them.
 */
function nextOutletOffset(gutter) {
    const len = Math.max(0.05, gutter.length);
    const margin = 0.12;
    const lo = -len / 2 + margin;
    const hi = len / 2 - margin;
    if (hi <= lo)
        return 0;
    const existing = (gutter.outlets ?? [])
        .map((o) => Math.max(lo, Math.min(hi, o.offset ?? 0)))
        .sort((a, b) => a - b);
    if (existing.length === 0)
        return hi;
    const bounds = [lo, ...existing, hi];
    let bestMid = (lo + hi) / 2;
    let bestGap = -1;
    for (let i = 0; i < bounds.length - 1; i++) {
        const gap = bounds[i + 1] - bounds[i];
        if (gap > bestGap) {
            bestGap = gap;
            bestMid = (bounds[i] + bounds[i + 1]) / 2;
        }
    }
    return bestMid;
}
/**
 * Downspouts subsection at the bottom of the gutter inspector. Lists the
 * downspouts attached to this gutter (one per outlet); "Add Downspout"
 * drills a fresh outlet at a spread-out position and drops a downspout
 * on it, and each row's ✕ removes both the downspout and its outlet.
 */
export default function DownspoutsPanel() {
    const selectedId = useViewer((s) => s.selection.selectedIds[0]);
    const setSelection = useViewer((s) => s.setSelection);
    const gutter = useScene((s) => selectedId ? s.nodes[selectedId] : undefined);
    const downspouts = useScene(useShallow((s) => {
        if (!selectedId)
            return [];
        const out = [];
        for (const n of Object.values(s.nodes)) {
            if (n?.type === 'downspout' && n.gutterId === selectedId) {
                out.push(n);
            }
        }
        return out;
    }));
    if (!gutter || gutter.type !== 'gutter')
        return null;
    const handleSelectDownspout = (id) => {
        setSelection({ selectedIds: [id] });
    };
    const handleAddDownspout = () => {
        const segmentId = gutter.roofSegmentId;
        if (!segmentId)
            return;
        const segment = useScene.getState().nodes[segmentId];
        if (!segment)
            return;
        const outletId = generateId('outlet');
        const outlets = [
            ...(gutter.outlets ?? []),
            { id: outletId, offset: nextOutletOffset(gutter), diameter: DEFAULT_OUTLET_DIAMETER },
        ];
        const state = useScene.getState();
        state.updateNode(gutter.id, { outlets });
        state.dirtyNodes.add(gutter.id);
        const outlet = resolveGutterOutletById({ ...gutter, outlets }, outletId);
        const dropLength = Math.max(0.1, computeEaveY(segment) + (outlet?.y ?? -gutter.size));
        const downspout = DownspoutNode.parse({
            name: 'Downspout',
            gutterId: gutter.id,
            outletId,
            length: dropLength,
            diameter: (outlet?.bore ?? DEFAULT_OUTLET_DIAMETER / 2) * 2,
        });
        state.createNode(downspout, segmentId);
        state.dirtyNodes.add(segmentId);
        setSelection({ selectedIds: [downspout.id] });
        triggerSFX('sfx:item-place');
    };
    const handleRemove = (downspout) => {
        const state = useScene.getState();
        // Drop the outlet this downspout drained so its hole closes up.
        if (downspout.outletId) {
            state.updateNode(gutter.id, {
                outlets: (gutter.outlets ?? []).filter((o) => o.id !== downspout.outletId),
            });
            state.dirtyNodes.add(gutter.id);
        }
        state.deleteNode(downspout.id);
        if (gutter.roofSegmentId)
            state.dirtyNodes.add(gutter.roofSegmentId);
        setSelection({ selectedIds: [gutter.id] });
    };
    return (_jsx(PanelSection, { title: "Downspouts", children: _jsxs("div", { className: "flex flex-col gap-1", children: [downspouts.map((d, i) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-foreground text-sm", children: [_jsx("button", { className: "flex-1 truncate text-left transition-colors hover:text-white", onClick: () => handleSelectDownspout(d.id), type: "button", children: d.name || `Downspout ${i + 1}` }), _jsx("button", { "aria-label": "Remove downspout", className: "ml-2 text-muted-foreground text-xs transition-colors hover:text-red-400", onClick: () => handleRemove(d), type: "button", children: "\u2715" })] }, d.id))), _jsx(ActionGroup, { children: _jsx(ActionButton, { label: "Add Downspout", onClick: handleAddDownspout }) })] }) }));
}
