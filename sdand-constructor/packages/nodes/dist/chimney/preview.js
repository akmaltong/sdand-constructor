'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildChimneyGeometry } from './geometry';
const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0xff_ff_ff,
    emissive: 0xff_ff_ff,
    emissiveIntensity: 0.12,
    roughness: 0.85,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
});
/**
 * The preview needs a segment fixture to build the body height. The
 * placement tool passes the segment under the cursor; before any
 * segment is hit, the preview isn't shown at all (the tool guards on
 * `previewPos`).
 */
const ChimneyPreview = ({ node, segment }) => {
    const geo = useMemo(() => buildChimneyGeometry(node, segment), [
        segment.wallHeight,
        segment.pitch,
        segment.roofType,
        segment.width,
        segment.depth,
        node.width,
        node.depth,
        node.heightAboveRidge,
        node.bodyShape,
        node.shoulderStyle,
        node.shoulderHeight,
        node.shoulderExtent,
        node.cap,
        node.capShape,
        node.capOverhang,
        node.capThickness,
        node.flueCount,
        node.flueShape,
        node.flueHeight,
        node.flueDiameter,
        node.flueSpacing,
        node.cricketStyle,
        node.cricketSide,
        node.cricketLength,
        node.cricketHeight,
        node.position[0],
        node.position[2],
        node.rotation,
    ]);
    useEffect(() => () => {
        geo.body.dispose();
        geo.cap?.dispose();
        geo.flues?.dispose();
        geo.cricket?.dispose();
    }, [geo]);
    return (_jsxs("group", { children: [_jsx("mesh", { geometry: geo.body, material: ghostMaterial, raycast: () => {
                    /* preview should not intercept the cursor */
                } }), geo.cap && _jsx("mesh", { geometry: geo.cap, material: ghostMaterial, raycast: () => { } }), geo.flues && _jsx("mesh", { geometry: geo.flues, material: ghostMaterial, raycast: () => { } }), geo.cricket && _jsx("mesh", { geometry: geo.cricket, material: ghostMaterial, raycast: () => { } })] }));
};
export default ChimneyPreview;
