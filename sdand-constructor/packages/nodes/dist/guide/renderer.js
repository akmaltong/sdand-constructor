'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useAssetUrl, useViewer } from '@pascal-app/viewer';
import { useLoader } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { DoubleSide, PlaneGeometry, TextureLoader } from 'three';
import { float, texture } from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';
export const GuideRenderer = ({ node }) => {
    const showGuides = useViewer((s) => s.showGuides);
    const ref = useRef(null);
    useRegistry(node.id, 'guide', ref);
    const resolvedUrl = useAssetUrl(node.url);
    return (_jsx("group", { position: node.position, ref: ref, rotation: [0, node.rotation[1], 0], visible: showGuides && node.visible !== false, children: resolvedUrl && (_jsx(Suspense, { children: _jsx(GuidePlane, { opacity: node.opacity, scale: node.scale, url: resolvedUrl }) })) }));
};
const GuidePlane = ({ url, scale, opacity }) => {
    const tex = useLoader(TextureLoader, url);
    // Pass the geometry as a prop. JSX-child `<planeGeometry>` plus
    // `frustumCulled={false}` lets the mesh submit a first-frame draw
    // with R3F's empty placeholder BufferGeometry before the child
    // attaches — WebGPU then flags "Vertex buffer slot 0 required by
    // [RenderPipeline renderPipeline_MeshBasicNodeMaterial_NNNN] was
    // not set." Same fix as wall-move-side-handles.tsx / grid.tsx.
    const { geometry, material } = useMemo(() => {
        const img = tex.image;
        const w = img.width || 1;
        const h = img.height || 1;
        const aspect = w / h;
        // Default: 10 meters wide, height from aspect ratio
        const planeWidth = 10 * scale;
        const planeHeight = (10 / aspect) * scale;
        const normalizedOpacity = opacity / 100;
        const mat = new MeshBasicNodeMaterial({
            transparent: true,
            colorNode: texture(tex),
            opacityNode: float(normalizedOpacity),
            side: DoubleSide,
            depthWrite: false,
        });
        const geom = new PlaneGeometry(planeWidth, planeHeight);
        geom.boundingBox = null;
        geom.boundingSphere = null;
        return { geometry: geom, material: mat };
    }, [tex, scale, opacity]);
    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
    }, [geometry, material]);
    return (_jsx("mesh", { frustumCulled: false, geometry: geometry, material: material, raycast: () => { }, rotation: [-Math.PI / 2, 0, 0] }));
};
export default GuideRenderer;
