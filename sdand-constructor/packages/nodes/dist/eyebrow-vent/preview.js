'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildEyebrowVentGeometry } from './geometry';
/**
 * Translucent ghost of an eyebrow vent, used by the placement tool's cursor
 * and the move-tool preview. Builds geometry through the shared pure builder
 * so the ghost stays in lockstep with the committed vent. Raycast disabled so
 * the preview doesn't intercept the cursor ray feeding the tool.
 */
const EyebrowVentPreview = ({ node }) => {
    const geometry = useMemo(() => buildEyebrowVentGeometry(node), [node.width, node.depth, node.height, node.style, node.louverCount, node.backRatio]);
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0xff_ff_ff,
        emissive: 0x6c_a3_ff,
        emissiveIntensity: 0.18,
        roughness: 0.7,
        metalness: 0.1,
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
export default EyebrowVentPreview;
