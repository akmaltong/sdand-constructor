'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useLiveNodeOverrides, useRegistry, useScene, } from '@pascal-app/core';
import { createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { computeEaveY } from '../gutter/eave-snap';
import { resolveGutterOutletById } from '../gutter/outlet-lookup';
import { buildDownspoutGeometry } from './geometry';
import { computeDownspoutRouting } from './routing';
const defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0xff_ff_ff,
    roughness: 0.7,
    metalness: 0.25,
});
/**
 * Downspout renderer. Mount chain mirrors the gutter's, then nests
 * one level deeper into the outlet position in gutter-mesh-local:
 *
 *   segment.position → segment.rotation (Y)
 *     → [gutter.position[0], computeEaveY(segment), gutter.position[2]]
 *     → gutter.rotation (Y)
 *     → [outlet.x, outlet.y, outlet.z]
 *     → mesh (pipe descends from Y = 0)
 *
 * Pulling the gutter's eave Y from `computeEaveY(effectiveSegment)`
 * means the downspout follows wallHeight / overhang / pitch changes
 * live, on the same frame as the gutter. The gutter and segment also
 * subscribe to `useLiveNodeOverrides` so drag-in-flight changes flow
 * through too.
 */
const DownspoutRenderer = ({ node: storeNode }) => {
    const ref = useRef(null);
    useRegistry(storeNode.id, 'downspout', ref);
    const handlers = useNodeEvents(storeNode, 'downspout');
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    const sceneTheme = useViewer((s) => s.sceneTheme);
    const overrides = useLiveNodeOverrides((s) => s.get(storeNode.id));
    const node = overrides
        ? { ...storeNode, ...overrides }
        : storeNode;
    // Host gutter — both scene + live overrides so drag-in-flight gutter
    // moves (length / position) reposition the downspout immediately.
    const gutter = useScene((s) => node.gutterId ? s.nodes[node.gutterId] : undefined);
    const gutterOverrides = useLiveNodeOverrides((s) => node.gutterId
        ? s.get(node.gutterId)
        : undefined);
    const effectiveGutter = gutter
        ? gutterOverrides
            ? { ...gutter, ...gutterOverrides }
            : gutter
        : undefined;
    // Segment of the host gutter (the downspout's own scene-graph parent
    // is the same segment — same as roof accessories — so the chain
    // segment → gutter-mesh-local is what we need to reach the outlet).
    const segment = useScene((s) => effectiveGutter?.roofSegmentId
        ? s.nodes[effectiveGutter.roofSegmentId]
        : undefined);
    const segmentOverrides = useLiveNodeOverrides((s) => effectiveGutter?.roofSegmentId
        ? s.get(effectiveGutter.roofSegmentId)
        : undefined);
    const effectiveSegment = segment
        ? segmentOverrides
            ? { ...segment, ...segmentOverrides }
            : segment
        : undefined;
    // Routing back to the wall — memoised on the gutter/segment values
    // that actually move the jog or the collar bore, so the pipe geometry
    // only rebuilds when one of those changes (not on every override-merge
    // render). Resolves to null when the gutter has no outlet.
    const routing = useMemo(() => effectiveGutter && effectiveSegment
        ? computeDownspoutRouting(effectiveGutter, effectiveSegment, node.outletId)
        : null, [
        effectiveGutter?.profile,
        effectiveGutter?.size,
        // The outlets array — its referenced entry's diameter / offset
        // drives the collar bore + nesting.
        effectiveGutter ? JSON.stringify(effectiveGutter.outlets) : undefined,
        effectiveSegment?.overhang,
        node.outletId,
    ]);
    const geometry = useMemo(() => buildDownspoutGeometry(node, routing), [
        node.length,
        node.diameter,
        node.standoff,
        node.shape,
        node.strapStyle,
        node.strapSpacing,
        node.terminal,
        routing,
    ]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    const material = useMemo(() => {
        if (!textures || (!node.material && !node.materialPreset)) {
            return createSurfaceRoleMaterial('roof', colorPreset, THREE.FrontSide, sceneTheme);
        }
        return node.material
            ? createMaterial(node.material, shading)
            : (createMaterialFromPresetRef(node.materialPreset, shading) ?? defaultMaterial);
    }, [textures, colorPreset, sceneTheme, shading, node.material, node.materialPreset]);
    if (!effectiveGutter || !effectiveSegment)
        return null;
    const outlet = resolveGutterOutletById(effectiveGutter, node.outletId);
    if (!outlet)
        return null;
    const segPos = effectiveSegment.position ?? [0, 0, 0];
    const segRotY = effectiveSegment.rotation ?? 0;
    const liveEaveY = computeEaveY(effectiveSegment);
    const gutterRotY = effectiveGutter.rotation ?? 0;
    // Bake the gutter's position + Y-rotation into the registered ref so it
    // sits as a DIRECT child of the segment-transform group — its local
    // pose is the outlet's full segment-local placement. `NodeArrowHandles`
    // copies the registered object's LOCAL transform into the segment's
    // object (it assumes a flat node → scene-parent chain); with the old
    // nested segment → gutter → outlet groups it only saw the innermost
    // `[outlet.x …]` offset and the handles landed at the roof centre.
    const gutterX = effectiveGutter.position[0] ?? 0;
    const gutterZ = effectiveGutter.position[2] ?? 0;
    const cos = Math.cos(gutterRotY);
    const sin = Math.sin(gutterRotY);
    const outletSegX = gutterX + (outlet.x * cos + outlet.z * sin);
    const outletSegZ = gutterZ + (-outlet.x * sin + outlet.z * cos);
    const outletSegY = liveEaveY + outlet.y;
    return (_jsx("group", { position: segPos, "rotation-y": segRotY, children: _jsx("group", { position: [outletSegX, outletSegY, outletSegZ], ref: ref, "rotation-y": gutterRotY, visible: node.visible, children: _jsx("mesh", { castShadow: true, geometry: geometry, material: material, name: "downspout-surface", receiveShadow: true, ...handlers }) }) }));
};
export default DownspoutRenderer;
