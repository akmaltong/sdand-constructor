'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { DownspoutNode, emitter, generateId, sceneRegistry, useScene, } from '@pascal-app/core';
import { triggerSFX } from '@pascal-app/editor';
import { useViewer } from '@pascal-app/viewer';
import { useEffect, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { computeEaveY } from '../gutter/eave-snap';
import { resolveGutterOutletById } from '../gutter/outlet-lookup';
import { downspoutDefinition } from './definition';
import DownspoutPreview from './preview';
import { computeDownspoutRouting } from './routing';
const DEFAULT_OUTLET_DIAMETER = 0.07;
/**
 * Downspout placement tool. Hovering a gutter previews a downspout at
 * the cursor's position ALONG the gutter; clicking drills a NEW outlet
 * there (appended to the gutter's `outlets`) and drops a downspout
 * linked to it. So multiple downspouts on one gutter land where you
 * click instead of stacking on a single outlet.
 *
 * The cursor's along-length offset is read by projecting the world hit
 * into the gutter's registered mesh frame (worldToLocal → local X). A
 * throwaway gutter with a single `preview` outlet feeds the same outlet
 * lookup + routing the committed pipe uses, so the ghost matches.
 */
const _hit = new Vector3();
const DownspoutTool = () => {
    const activeBuildingId = useViewer((s) => s.selection.buildingId);
    const setSelection = useViewer((s) => s.setSelection);
    const [target, setTarget] = useState(null);
    const previewNode = useMemo(() => DownspoutNode.parse({
        ...downspoutDefinition.defaults(),
        name: 'Downspout',
    }), []);
    useEffect(() => {
        if (!activeBuildingId)
            return;
        // Cursor's offset along the gutter length, from the world hit.
        const cursorOffset = (gutter, world) => {
            const obj = sceneRegistry.nodes.get(gutter.id);
            if (!obj)
                return null;
            obj.updateWorldMatrix(true, false);
            return obj.worldToLocal(_hit.set(world[0], world[1], world[2])).x;
        };
        const computeTarget = (event) => {
            const gutter = event.node;
            const segmentId = gutter.roofSegmentId;
            if (!segmentId)
                return null;
            const segment = useScene.getState().nodes[segmentId];
            if (!segment)
                return null;
            const offset = cursorOffset(gutter, event.position);
            if (offset === null)
                return null;
            // Throwaway single-outlet gutter at the cursor so the lookup +
            // routing produce the exact pose the commit will store.
            const ghost = {
                ...gutter,
                outlets: [{ id: 'preview', offset, diameter: DEFAULT_OUTLET_DIAMETER }],
            };
            const outlet = resolveGutterOutletById(ghost, 'preview');
            if (!outlet)
                return null;
            return {
                segment: {
                    position: (segment.position ?? [0, 0, 0]),
                    rotation: segment.rotation ?? 0,
                    eaveY: computeEaveY(segment),
                },
                gutter: {
                    position: (gutter.position ?? [0, 0, 0]),
                    rotation: gutter.rotation ?? 0,
                },
                outlet,
                routing: computeDownspoutRouting(ghost, segment, 'preview'),
            };
        };
        const updatePreview = (event) => {
            const next = computeTarget(event);
            if (next) {
                setTarget(next);
                event.stopPropagation();
            }
        };
        const onClick = (event) => {
            const gutter = event.node;
            const segmentId = gutter.roofSegmentId;
            if (!segmentId)
                return;
            const segment = useScene.getState().nodes[segmentId];
            if (!segment)
                return;
            const offset = cursorOffset(gutter, event.position);
            if (offset === null)
                return;
            // Drill a new outlet at the clicked offset, then drop a downspout
            // linked to it. Both land in one undoable step.
            const outletId = generateId('outlet');
            const outlets = [
                ...(gutter.outlets ?? []),
                { id: outletId, offset, diameter: DEFAULT_OUTLET_DIAMETER },
            ];
            const state = useScene.getState();
            state.updateNode(gutter.id, { outlets });
            state.dirtyNodes.add(gutter.id);
            const outlet = resolveGutterOutletById({ ...gutter, outlets }, outletId);
            if (!outlet)
                return;
            // Drop from the gutter outlet (at eaveY − size) down to segment Y = 0.
            const dropLength = Math.max(0.1, computeEaveY(segment) + outlet.y);
            const downspout = DownspoutNode.parse({
                ...downspoutDefinition.defaults(),
                name: 'Downspout',
                gutterId: gutter.id,
                outletId,
                length: dropLength,
                diameter: outlet.bore * 2,
            });
            state.createNode(downspout, segmentId);
            state.dirtyNodes.add(segmentId);
            setSelection({ selectedIds: [downspout.id] });
            triggerSFX('sfx:item-place');
            event.stopPropagation();
        };
        emitter.on('gutter:move', updatePreview);
        emitter.on('gutter:enter', updatePreview);
        emitter.on('gutter:click', onClick);
        return () => {
            emitter.off('gutter:move', updatePreview);
            emitter.off('gutter:enter', updatePreview);
            emitter.off('gutter:click', onClick);
        };
    }, [activeBuildingId, setSelection]);
    if (!activeBuildingId || !target)
        return null;
    return (_jsx("group", { position: target.segment.position, "rotation-y": target.segment.rotation, children: _jsx("group", { position: [target.gutter.position[0], target.segment.eaveY, target.gutter.position[2]], "rotation-y": target.gutter.rotation, children: _jsx("group", { position: [target.outlet.x, target.outlet.y, target.outlet.z], children: _jsx(DownspoutPreview, { node: previewNodeWithDefaults(previewNode, target), routing: target.routing }) }) }) }));
};
function previewNodeWithDefaults(base, target) {
    // Snap preview to the same dimensions a commit would use — bore
    // diameter from the gutter, drop length to the segment Y=0 plane.
    return {
        ...base,
        diameter: target.outlet.bore * 2,
        length: Math.max(0.1, target.segment.eaveY + target.outlet.y),
    };
}
export default DownspoutTool;
