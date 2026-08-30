'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildBoxVentGeometry } from './geometry';
/**
 * Translucent ghost of a box vent, used by the placement tool's cursor
 * and the move-tool preview. Builds the geometry through the shared
 * pure builder so the ghost shape stays in lockstep with the committed
 * vent.
 *
 * Raycast is disabled on the mesh — the cursor follows the vent, so
 * leaving raycast active would cause the preview itself to intercept
 * the cursor ray and starve the placement tool of `roof:move` events.
 */
const BoxVentPreview = ({ node }) => {
    const geometry = useMemo(() => buildBoxVentGeometry(node), [node.width, node.depth, node.height, node.hoodOverhang, node.style]);
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0xff_ff_ff,
        emissive: 0x6c_a3_ff,
        emissiveIntensity: 0.18,
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
    }), []);
    const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 25), [geometry]);
    useEffect(() => () => {
        geometry.dispose();
        edgesGeometry.dispose();
        material.dispose();
    }, [geometry, edgesGeometry, material]);
    return (_jsxs("group", { "rotation-y": node.rotation ?? 0, children: [_jsx("mesh", { geometry: geometry, material: material, raycast: () => {
                    /* disabled — see component-level note */
                } }), _jsx("lineSegments", { geometry: edgesGeometry, renderOrder: 1000, children: _jsx("lineBasicMaterial", { color: 0x6c_a3_ff, depthTest: false, opacity: 0.95, transparent: true }) })] }));
};
export default BoxVentPreview;
