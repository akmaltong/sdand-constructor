'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { emitter, GutterNode, useScene, } from '@pascal-app/core';
import { triggerSFX } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveRoofSegmentHit } from '../shared/roof-segment-hit';
import { gutterDefinition } from './definition';
import { resolveEaveSnap } from './eave-snap';
import GutterPreview from './preview';
/**
 * Gutter placement tool. Cursor preview snaps to the OUTER eave — the
 * drip edge of the roof, NOT the wall line. The eave sits at
 * `Z = ±(depth/2 + overhang)` in segment-local frame; the gutter
 * mounts against the fascia there, hanging outward from the building.
 *
 * Which eave: `eave-snap.ts` picks the side closest to the cursor
 * (roof-type aware — 4-way for hip/flat, low side only for shed, ±Z
 * for the rest) and returns the segment-local snap pose. The same
 * snap drives the ghost AND the commit, so picking-up + putting-down
 * land at identical world coordinates.
 *
 * Ghost transform: we mount the GutterPreview under the exact same
 * chain the GutterRenderer applies — roof.position + roof.rotation →
 * segment.position + segment.rotation → snap.eave + snap.rotation.
 * No `worldToBuildingLocal` + `previewYaw`-sum shortcut: that
 * collapses three Y rotations into one scalar and converts world
 * coords back into building-local, which is mathematically
 * equivalent for pure-Y stacks but drifts under any future non-Y
 * roof/segment transform. Sharing the renderer's chain means the
 * ghost and the placed mesh are guaranteed pixel-identical.
 */
const GutterTool = () => {
    const activeBuildingId = useViewer((s) => s.selection.buildingId);
    const setSelection = useViewer((s) => s.setSelection);
    const [target, setTarget] = useState(null);
    const lastSnapRef = useRef(null);
    const previewNode = useMemo(() => GutterNode.parse({
        ...gutterDefinition.defaults(),
        name: 'Gutter',
        position: [0, 0, 0],
        rotation: 0,
    }), []);
    useEffect(() => {
        if (!activeBuildingId)
            return;
        const updatePreview = (event) => {
            const roof = event.node;
            const hit = resolveRoofSegmentHit(roof, event.position[0], event.position[1], event.position[2]);
            if (!hit)
                return;
            const snap = resolveEaveSnap(hit.segment, hit.localX, hit.localZ);
            // Grid-snap chime fires when the segment-local snap moves to a
            // new 5 cm cell along the eave — keeps SFX in lockstep with what
            // the commit will actually store.
            const sx = Math.round(snap.eaveX * 20) / 20;
            const sz = Math.round(snap.eaveZ * 20) / 20;
            const prev = lastSnapRef.current;
            if (!prev || prev[0] !== sx || prev[1] !== sz) {
                triggerSFX('sfx:grid-snap');
                lastSnapRef.current = [sx, sz];
            }
            setTarget({
                roof: {
                    position: (roof.position ?? [0, 0, 0]),
                    rotation: roof.rotation ?? 0,
                },
                segment: {
                    position: (hit.segment.position ?? [0, 0, 0]),
                    rotation: hit.segment.rotation ?? 0,
                },
                snap,
            });
            event.stopPropagation();
        };
        const onClick = (event) => {
            const hit = resolveRoofSegmentHit(event.node, event.position[0], event.position[1], event.position[2]);
            if (!hit)
                return;
            const state = useScene.getState();
            const snap = resolveEaveSnap(hit.segment, hit.localX, hit.localZ);
            const gutter = GutterNode.parse({
                ...gutterDefinition.defaults(),
                name: 'Gutter',
                roofSegmentId: hit.segment.id,
                // (X, Y, Z) all come from the eave snap — on ±Z eaves X stays
                // free along the cursor; on ±X eaves Z stays free instead.
                // Rotation orients the gutter's outward axis away from the
                // building on whichever side the click landed.
                position: [snap.eaveX, snap.eaveY, snap.eaveZ],
                rotation: snap.rotation,
            });
            state.createNode(gutter, hit.segment.id);
            state.dirtyNodes.add(hit.segment.id);
            setSelection({ selectedIds: [gutter.id] });
            triggerSFX('sfx:item-place');
            event.stopPropagation();
        };
        emitter.on('roof:move', updatePreview);
        emitter.on('roof:enter', updatePreview);
        emitter.on('roof:click', onClick);
        return () => {
            emitter.off('roof:move', updatePreview);
            emitter.off('roof:enter', updatePreview);
            emitter.off('roof:click', onClick);
        };
    }, [activeBuildingId, setSelection]);
    if (!activeBuildingId || !target)
        return null;
    return (_jsx("group", { position: target.roof.position, "rotation-y": target.roof.rotation, children: _jsx("group", { position: target.segment.position, "rotation-y": target.segment.rotation, children: _jsx("group", { position: [target.snap.eaveX, target.snap.eaveY, target.snap.eaveZ], "rotation-y": target.snap.rotation, children: _jsx(GutterPreview, { node: previewNode }) }) }) }));
};
export default GutterTool;
