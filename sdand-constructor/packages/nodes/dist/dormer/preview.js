'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildDormerGhostGeometry } from './geometry';
const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x88_88_88,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
});
const DormerPreview = ({ node }) => {
    const geo = useMemo(() => buildDormerGhostGeometry(node), [node.width, node.depth, node.height, node.roofHeight, node.roofType, node.wallSkirtHeight]);
    useEffect(() => () => geo.dispose(), [geo]);
    return _jsx("mesh", { geometry: geo, material: ghostMaterial, raycast: () => { } });
};
export default DormerPreview;
