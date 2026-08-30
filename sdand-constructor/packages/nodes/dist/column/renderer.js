'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLiveNodeOverrides, useLiveTransforms, useRegistry, } from '@pascal-app/core';
import { baseMaterial, createColumnBoxGeometry, createColumnCylinderGeometry, createColumnSphereGeometry, createColumnTorusGeometry, createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
const ColumnMaterialContext = createContext(baseMaterial());
const ColumnEdgeSoftnessContext = createContext(0.025);
function ColumnMaterial() {
    const material = useContext(ColumnMaterialContext);
    return _jsx("primitive", { attach: "material", object: material });
}
function createColumnMaterial({ material, materialPreset, shading, textures, colorPreset, }) {
    if (!textures)
        return createSurfaceRoleMaterial('wall', colorPreset);
    const presetMaterial = createMaterialFromPresetRef(materialPreset, shading);
    if (presetMaterial)
        return presetMaterial;
    if (material)
        return createMaterial(material, shading);
    return baseMaterial(shading);
}
function getSegments(node) {
    if (node.crossSection === 'octagonal')
        return 8;
    if (node.crossSection === 'sixteen-sided')
        return 16;
    return 32;
}
function getShaftProfile(node) {
    return node.shaftProfile ?? (node.shaftTaper > 0 ? 'tapered' : 'straight');
}
function getShaftSegmentCount(node) {
    const shaftProfile = getShaftProfile(node);
    const shaftTaper = node.shaftTaper ?? 0;
    const hasTwist = Math.abs(node.shaftTwistStep ?? 0) > 0.001;
    return Math.max(hasTwist ? 4 : 1, shaftProfile === 'straight' && shaftTaper <= 0 && !hasTwist
        ? 1
        : (node.shaftSegmentCount ?? (hasTwist ? 12 : 24)));
}
function getShaftTwistRadians(node, index) {
    return ((node.shaftTwistStep ?? 0) * Math.PI * index) / 180;
}
function getShaftScaleAt(node, t) {
    const shaftProfile = getShaftProfile(node);
    const shaftTaper = Math.min(node.shaftTaper ?? 0, 0.85);
    const startScale = node.shaftStartScale ?? 0.72;
    const endScale = node.shaftEndScale ?? startScale;
    const shaftBulge = node.shaftBulge ??
        (shaftProfile === 'bulged'
            ? 0.16
            : shaftProfile === 'baluster'
                ? 0.2
                : shaftProfile === 'hourglass'
                    ? 0.18
                    : 0);
    const taperedScale = 1 - shaftTaper * t;
    const linearScale = (startScale + (endScale - startScale) * t) * taperedScale;
    const bulgeCurve = Math.sin(Math.PI * t);
    const hourglassCurve = Math.abs(t - 0.5) * 2;
    const profileScale = shaftProfile === 'bulged' || shaftProfile === 'baluster'
        ? linearScale + shaftBulge * bulgeCurve
        : shaftProfile === 'hourglass'
            ? linearScale - shaftBulge * (1 - hourglassCurve)
            : linearScale;
    return Math.max(0.1, profileScale);
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function MappedBox({ depth, height, position, rotation, softenEdges = true, width, }) {
    const edgeSoftness = useContext(ColumnEdgeSoftnessContext);
    const minDimension = Math.max(0, Math.min(width, height, depth));
    const bevelRadius = softenEdges ? Math.min(Math.max(0, edgeSoftness), minDimension * 0.35) : 0;
    const geometry = useMemo(() => {
        if (height <= 0 || width <= 0 || depth <= 0)
            return null;
        return createColumnBoxGeometry(width, height, depth, bevelRadius);
    }, [bevelRadius, depth, height, width]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, position: position, receiveShadow: true, rotation: rotation, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function FlatEndedBeam({ depth, end, start, width, }) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const length = Math.hypot(dx, dy, dz);
    const geometry = useMemo(() => {
        if (length <= 0.001 || width <= 0 || depth <= 0)
            return null;
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const bottomY = start[1];
        const topY = end[1];
        const bottomCenterX = start[0];
        const topCenterX = end[0];
        const bottomCenterZ = start[2];
        const topCenterZ = end[2];
        const vertices = [
            [bottomCenterX - halfWidth, bottomY, bottomCenterZ - halfDepth],
            [bottomCenterX + halfWidth, bottomY, bottomCenterZ - halfDepth],
            [bottomCenterX + halfWidth, bottomY, bottomCenterZ + halfDepth],
            [bottomCenterX - halfWidth, bottomY, bottomCenterZ + halfDepth],
            [topCenterX - halfWidth, topY, topCenterZ - halfDepth],
            [topCenterX + halfWidth, topY, topCenterZ - halfDepth],
            [topCenterX + halfWidth, topY, topCenterZ + halfDepth],
            [topCenterX - halfWidth, topY, topCenterZ + halfDepth],
        ];
        const faceQuads = [
            [0, 1, 2, 3],
            [4, 7, 6, 5],
            [0, 4, 5, 1],
            [1, 5, 6, 2],
            [2, 6, 7, 3],
            [3, 7, 4, 0],
        ];
        const positions = [];
        const uvs = [];
        const pushVertex = (vertexIndex, uv) => {
            const vertex = vertices[vertexIndex];
            if (!vertex)
                return false;
            positions.push(...vertex);
            uvs.push(...uv);
            return true;
        };
        const pushTriangle = (a, b, c, uvA, uvB, uvC) => {
            const va = vertices[a];
            const vb = vertices[b];
            const vc = vertices[c];
            if (!va || !vb || !vc)
                return;
            pushVertex(a, uvA);
            pushVertex(b, uvB);
            pushVertex(c, uvC);
        };
        for (const [a, b, c, d] of faceQuads) {
            const va = vertices[a];
            const vb = vertices[b];
            const vc = vertices[c];
            const vd = vertices[d];
            if (!va || !vb || !vc || !vd)
                continue;
            const edgeU = Math.hypot(vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]);
            const edgeV = Math.hypot(vd[0] - va[0], vd[1] - va[1], vd[2] - va[2]);
            const uvA = [0, 0];
            const uvB = [edgeU, 0];
            const uvC = [edgeU, edgeV];
            const uvD = [0, edgeV];
            pushTriangle(a, b, c, uvA, uvB, uvC);
            pushTriangle(a, c, d, uvA, uvC, uvD);
            pushTriangle(a, c, b, uvA, uvC, uvB);
            pushTriangle(a, d, c, uvA, uvD, uvC);
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('uv2', new Float32BufferAttribute(uvs.slice(), 2));
        geometry.computeVertexNormals();
        return geometry;
    }, [depth, length, start, end, width]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, receiveShadow: true, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function AFrameSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const bottomSpread = Math.max(0.2, node.braceBottomSpread ?? Math.max(node.width * 3, 1.2));
    const topSpread = clamp(node.braceTopSpread ?? 0.12, 0, bottomSpread);
    const bottomY = 0;
    const topY = height;
    const leftBottom = [-bottomSpread / 2, bottomY, 0];
    const rightBottom = [bottomSpread / 2, bottomY, 0];
    const leftTop = [-topSpread / 2, topY, 0];
    const rightTop = [topSpread / 2, topY, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const footPlateWidth = braceWidth * 1.9;
    const footPlateDepth = braceDepth * 1.75;
    const topPlateWidth = Math.max(topSpread + braceWidth * 1.9, braceWidth * 2.2);
    const topPlateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: leftTop, start: leftBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: rightBottom, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [leftBottom[0], plateHeight / 2, leftBottom[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [rightBottom[0], plateHeight / 2, rightBottom[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: topPlateDepth, height: plateHeight, position: [0, height - plateHeight / 2, 0], width: topPlateWidth })] }))] }));
}
function YFrameSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const topSpread = Math.max(0.2, node.braceTopSpread ?? 0.9);
    const splitY = height * 0.56;
    const foot = [0, 0, 0];
    const split = [0, splitY, 0];
    const leftTop = [-topSpread / 2, height, 0];
    const rightTop = [topSpread / 2, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const footPlateWidth = braceWidth * 1.9;
    const footPlateDepth = braceDepth * 1.75;
    const topPlateWidth = topSpread + braceWidth * 1.9;
    const topPlateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: split, start: foot, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: leftTop, start: split, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: split, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [foot[0], plateHeight / 2, foot[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: topPlateDepth, height: plateHeight, position: [0, height - plateHeight / 2, 0], width: topPlateWidth })] }))] }));
}
function VFrameSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const topSpread = Math.max(0.2, node.braceTopSpread ?? 1);
    const foot = [0, 0, 0];
    const leftTop = [-topSpread / 2, height, 0];
    const rightTop = [topSpread / 2, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const footPlateWidth = braceWidth * 1.9;
    const footPlateDepth = braceDepth * 1.75;
    const topPlateWidth = topSpread + braceWidth * 1.9;
    const topPlateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: leftTop, start: foot, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: foot, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [foot[0], plateHeight / 2, foot[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: topPlateDepth, height: plateHeight, position: [0, height - plateHeight / 2, 0], width: topPlateWidth })] }))] }));
}
function XBraceSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const bottomSpread = Math.max(0.2, node.braceBottomSpread ?? 1);
    const topSpread = Math.max(0.2, node.braceTopSpread ?? 1);
    const leftBottom = [-bottomSpread / 2, 0, 0];
    const rightBottom = [bottomSpread / 2, 0, 0];
    const leftTop = [-topSpread / 2, height, 0];
    const rightTop = [topSpread / 2, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const footPlateWidth = braceWidth * 1.9;
    const footPlateDepth = braceDepth * 1.75;
    const topPlateWidth = braceWidth * 1.9;
    const topPlateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: leftBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: leftTop, start: rightBottom, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [leftBottom[0], plateHeight / 2, leftBottom[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: footPlateDepth, height: plateHeight, position: [rightBottom[0], plateHeight / 2, rightBottom[2]], width: footPlateWidth }), _jsx(MappedBox, { depth: topPlateDepth, height: plateHeight, position: [leftTop[0], height - plateHeight / 2, leftTop[2]], width: topPlateWidth }), _jsx(MappedBox, { depth: topPlateDepth, height: plateHeight, position: [rightTop[0], height - plateHeight / 2, rightTop[2]], width: topPlateWidth })] }))] }));
}
function KBraceSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const spread = Math.max(0.2, Math.max(node.braceBottomSpread ?? 1, node.braceTopSpread ?? 1));
    const leftBottom = [-spread / 2, 0, 0];
    const leftTop = [-spread / 2, height, 0];
    const centerBottom = [0, 0, 0];
    const centerMiddle = [0, height / 2, 0];
    const centerTop = [0, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: centerTop, start: centerBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: centerMiddle, start: leftBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: centerMiddle, start: leftTop, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [leftBottom[0], plateHeight / 2, leftBottom[2]], width: plateWidth }), _jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [centerBottom[0], plateHeight / 2, centerBottom[2]], width: plateWidth }), _jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [leftTop[0], height - plateHeight / 2, leftTop[2]], width: plateWidth }), _jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [centerTop[0], height - plateHeight / 2, centerTop[2]], width: plateWidth })] }))] }));
}
function SingleStrutSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const spread = Math.max(0.2, Math.max(node.braceBottomSpread ?? 1, node.braceTopSpread ?? 1));
    const bottom = [-spread / 2, 0, 0];
    const top = [spread / 2, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: top, start: bottom, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [bottom[0], plateHeight / 2, bottom[2]], width: plateWidth }), _jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [top[0], height - plateHeight / 2, top[2]], width: plateWidth })] }))] }));
}
function TripodSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const width = Math.max(0.2, node.braceBottomSpread ?? 1.1);
    const depth = Math.max(0.2, node.braceTopSpread ?? 1.1);
    const top = [0, height, 0];
    const feet = [
        [0, 0, -depth / 2],
        [-width / 2, 0, depth / 2],
        [width / 2, 0, depth / 2],
    ];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [feet.map((foot, index) => (_jsx(FlatEndedBeam, { depth: braceDepth, end: top, start: foot, width: braceWidth }, `leg-${index}`))), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [feet.map((foot, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [foot[0], plateHeight / 2, foot[2]], width: plateWidth }, `foot-${index}`))), _jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [0, height - plateHeight / 2, 0], width: plateWidth })] }))] }));
}
function TrestleSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const width = Math.max(0.2, node.braceBottomSpread ?? 1.2);
    const depth = Math.max(0.2, node.braceTopSpread ?? 1);
    const zPositions = [-depth / 2, depth / 2];
    const topPoints = zPositions.map((z) => [0, height, z]);
    const footPoints = zPositions.flatMap((z) => [
        [-width / 2, 0, z],
        [width / 2, 0, z],
    ]);
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [zPositions.map((z, index) => {
                const leftBottom = [-width / 2, 0, z];
                const rightBottom = [width / 2, 0, z];
                const top = topPoints[index] ?? [0, height, z];
                return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: top, start: leftBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: top, start: rightBottom, width: braceWidth })] }, `frame-${z}`));
            }), _jsx(FlatEndedBeam, { depth: braceDepth, end: topPoints[1] ?? [0, height, depth / 2], start: topPoints[0] ?? [0, height, -depth / 2], width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [footPoints.map((foot, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [foot[0], plateHeight / 2, foot[2]], width: plateWidth }, `foot-${index}`))), topPoints.map((top, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [top[0], height - plateHeight / 2, top[2]], width: plateWidth }, `top-${index}`)))] }))] }));
}
function PortalFrameSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const width = Math.max(0.2, node.braceBottomSpread ?? 1.4);
    const leftBottom = [-width / 2, 0, 0];
    const rightBottom = [width / 2, 0, 0];
    const leftTop = [-width / 2, height, 0];
    const rightTop = [width / 2, height, 0];
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [_jsx(FlatEndedBeam, { depth: braceDepth, end: leftTop, start: leftBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: rightBottom, width: braceWidth }), _jsx(FlatEndedBeam, { depth: braceDepth, end: rightTop, start: leftTop, width: braceWidth }), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [[leftBottom, rightBottom].map((foot, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [foot[0], plateHeight / 2, foot[2]], width: plateWidth }, `foot-${index}`))), [leftTop, rightTop].map((top, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [top[0], height - plateHeight / 2, top[2]], width: plateWidth }, `top-${index}`)))] }))] }));
}
function BoxFrameSupport({ node }) {
    const height = Math.max(0.2, node.height);
    const braceWidth = clamp(node.braceWidth ?? node.width, 0.04, 1.6);
    const braceDepth = clamp(node.braceDepth ?? node.depth, 0.04, 1.6);
    const width = Math.max(0.2, node.braceBottomSpread ?? 1.4);
    const depth = Math.max(0.2, node.braceTopSpread ?? 1);
    const corners = [
        [-width / 2, 0, -depth / 2],
        [width / 2, 0, -depth / 2],
        [width / 2, 0, depth / 2],
        [-width / 2, 0, depth / 2],
    ];
    const topCorners = corners.map(([x, _y, z]) => [x, height, z]);
    const plateHeight = Math.max(0.035, Math.min(0.08, braceWidth * 0.45));
    const plateWidth = braceWidth * 1.9;
    const plateDepth = braceDepth * 1.75;
    return (_jsxs("group", { children: [corners.map((corner, index) => (_jsx(FlatEndedBeam, { depth: braceDepth, end: topCorners[index] ?? [corner[0], height, corner[2]], start: corner, width: braceWidth }, `post-${index}`))), topCorners.map((corner, index) => (_jsx(FlatEndedBeam, { depth: braceDepth, end: topCorners[(index + 1) % topCorners.length] ?? corner, start: corner, width: braceWidth }, `top-rail-${index}`))), corners.map((corner, index) => (_jsx(FlatEndedBeam, { depth: braceDepth, end: corners[(index + 1) % corners.length] ?? corner, start: corner, width: braceWidth }, `bottom-rail-${index}`))), (node.bracePlateEnabled ?? true) && (_jsxs(_Fragment, { children: [corners.map((corner, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [corner[0], plateHeight / 2, corner[2]], width: plateWidth }, `foot-${index}`))), topCorners.map((corner, index) => (_jsx(MappedBox, { depth: plateDepth, height: plateHeight, position: [corner[0], height - plateHeight / 2, corner[2]], width: plateWidth }, `top-${index}`)))] }))] }));
}
function MappedCylinder({ height, position, radius, radiusBottom = radius, radiusTop = radius, radiusX = 1, radiusZ = 1, rotation, segments = 32, }) {
    const geometry = useMemo(() => {
        if (height <= 0 || radius <= 0 || radiusBottom < 0 || radiusTop < 0)
            return null;
        return createColumnCylinderGeometry({
            height,
            radiusBottom,
            radiusTop,
            radiusX,
            radiusZ,
            segments,
        });
    }, [height, radius, radiusBottom, radiusTop, radiusX, radiusZ, segments]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, position: position, receiveShadow: true, rotation: rotation, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function MappedCone({ height, position, radiusX, radiusZ = radiusX, rotation, segments = 6, }) {
    const geometry = useMemo(() => {
        if (height <= 0 || radiusX <= 0 || radiusZ <= 0)
            return null;
        return createColumnCylinderGeometry({
            height,
            radiusBottom: 1,
            radiusTop: 0,
            radiusX,
            radiusZ,
            segments,
        });
    }, [height, radiusX, radiusZ, segments]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, position: position, receiveShadow: true, rotation: rotation, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function MappedSphere({ position, radius, segments = 10, verticalSegments = 8, }) {
    const geometry = useMemo(() => {
        if (radius <= 0)
            return null;
        return createColumnSphereGeometry(radius, segments, verticalSegments);
    }, [radius, segments, verticalSegments]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, position: position, receiveShadow: true, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function MappedTorus({ arc, position, ringRadius, rotation, scaleX, scaleY, scaleZ, tubeRadius, }) {
    const geometry = useMemo(() => {
        if (ringRadius <= 0 || tubeRadius <= 0)
            return null;
        return createColumnTorusGeometry({
            arc,
            ringRadius,
            scaleX,
            scaleY,
            scaleZ,
            tubeRadius,
        });
    }, [arc, ringRadius, scaleX, scaleY, scaleZ, tubeRadius]);
    if (!geometry)
        return null;
    return (_jsxs("mesh", { castShadow: true, dispose: null, position: position, receiveShadow: true, rotation: rotation, children: [_jsx("primitive", { attach: "geometry", dispose: null, object: geometry }), _jsx(ColumnMaterial, {})] }));
}
function SquareBlock({ y, height, width, depth, softenEdges = true, }) {
    return (_jsx(MappedBox, { depth: depth, height: height, position: [0, y + height / 2, 0], softenEdges: softenEdges, width: width }));
}
function RoundBlock({ x = 0, y, z = 0, height, radius, segments = 32, }) {
    return (_jsx(MappedCylinder, { height: height, position: [x, y + height / 2, z], radius: radius, segments: segments }));
}
function RoundedRectangleShaftSegment({ y, height, width, depth, cornerRadius, }) {
    if (height <= 0)
        return null;
    const radius = Math.min(Math.max(0, cornerRadius), Math.min(width, depth) * 0.45);
    if (radius <= 0.001) {
        return _jsx(SquareBlock, { depth: depth, height: height, width: width, y: y });
    }
    const innerWidth = Math.max(0, width - radius * 2);
    const innerDepth = Math.max(0, depth - radius * 2);
    const cornerX = width / 2 - radius;
    const cornerZ = depth / 2 - radius;
    return (_jsxs("group", { children: [innerWidth > 0 && (_jsx(SquareBlock, { depth: depth, height: height, softenEdges: false, width: innerWidth, y: y })), innerDepth > 0 && (_jsx(SquareBlock, { depth: innerDepth, height: height, softenEdges: false, width: width, y: y })), [
                [cornerX, cornerZ],
                [cornerX, -cornerZ],
                [-cornerX, cornerZ],
                [-cornerX, -cornerZ],
            ].map(([x, z], index) => (_jsx(RoundBlock, { height: height, radius: radius, segments: 18, x: x, y: y, z: z }, index)))] }));
}
function OvalBlock({ y, height, width, depth, segments = 32, }) {
    return (_jsx(MappedCylinder, { height: height, position: [0, y + height / 2, 0], radius: 1, radiusX: width / 2, radiusZ: depth / 2, segments: segments }));
}
function ColumnBlock({ node, y, height, scale = 1, }) {
    if (height <= 0)
        return null;
    const width = node.width * scale;
    const depth = node.depth * scale;
    const radius = node.radius * scale;
    if (node.crossSection === 'square' || node.crossSection === 'rectangular') {
        return _jsx(SquareBlock, { depth: depth, height: height, width: width, y: y });
    }
    return _jsx(RoundBlock, { height: height, radius: radius, segments: getSegments(node), y: y });
}
function TaperedRoundShaft({ node, y, height }) {
    const segmentCount = getShaftSegmentCount(node);
    const segmentHeight = height / segmentCount;
    return (_jsx("group", { children: Array.from({ length: segmentCount }, (_, index) => {
            const t = (index + 0.5) / segmentCount;
            const profileScale = getShaftScaleAt(node, t);
            return (_jsx("group", { rotation: [0, getShaftTwistRadians(node, index), 0], children: _jsx(RoundBlock, { height: segmentHeight * 1.015, radius: node.radius * profileScale, segments: getSegments(node), y: y + index * segmentHeight }) }, index));
        }) }));
}
function TaperedSquareShaft({ node, y, height }) {
    const segmentCount = getShaftSegmentCount(node);
    const segmentHeight = height / segmentCount;
    return (_jsx("group", { children: Array.from({ length: segmentCount }, (_, index) => {
            const t = (index + 0.5) / segmentCount;
            const profileScale = getShaftScaleAt(node, t);
            return (_jsx("group", { rotation: [0, getShaftTwistRadians(node, index), 0], children: _jsx(RoundedRectangleShaftSegment, { cornerRadius: (node.shaftCornerRadius ?? 0.035) * profileScale, depth: node.depth * profileScale, height: segmentHeight * 1.015, width: node.width * profileScale, y: y + index * segmentHeight }) }, index));
        }) }));
}
function Shaft({ node, y, height }) {
    if (height <= 0)
        return null;
    if (node.style === 'cluster') {
        const sideRadius = Math.max(0.04, node.radius * 0.36);
        const offset = Math.max(node.radius * 0.78, node.width * 0.22);
        return (_jsxs("group", { children: [_jsx(RoundBlock, { height: height, radius: node.radius * 0.62, segments: 24, y: y }), [
                    [offset, 0],
                    [-offset, 0],
                    [0, offset],
                    [0, -offset],
                ].map(([x, z], index) => (_jsx(RoundBlock, { height: height, radius: sideRadius, segments: 16, x: x, y: y, z: z }, `${x}-${z}-${index}`)))] }));
    }
    if (node.crossSection === 'round' ||
        node.crossSection === 'octagonal' ||
        node.crossSection === 'sixteen-sided') {
        return _jsx(TaperedRoundShaft, { height: height, node: node, y: y });
    }
    return _jsx(TaperedSquareShaft, { height: height, node: node, y: y });
}
function Base({ node, height }) {
    if (height <= 0)
        return null;
    const baseStyle = node.baseStyle ?? 'round-rings';
    const widthScale = node.baseWidthScale ?? 1.24;
    const depthScale = node.baseDepthScale ?? widthScale;
    if (baseStyle === 'none')
        return null;
    if (baseStyle === 'simple-square') {
        return (_jsx(SquareBlock, { depth: node.depth * depthScale, height: height, width: node.width * widthScale, y: 0 }));
    }
    if (baseStyle === 'square-plinth') {
        return (_jsxs("group", { children: [_jsx(SquareBlock, { depth: node.depth * depthScale, height: height * 0.35, width: node.width * widthScale, y: 0 }), _jsx(SquareBlock, { depth: node.depth * Math.max(0.9, depthScale * 0.84), height: height * 0.65, width: node.width * Math.max(0.9, widthScale * 0.84), y: height * 0.35 })] }));
    }
    if (baseStyle === 'stepped-square') {
        const tierCount = Math.max(3, node.baseTierCount ?? 3);
        const tierHeight = height / tierCount;
        const stepSpread = node.baseStepSpread ?? 0.42;
        return (_jsx("group", { children: Array.from({ length: tierCount }, (_, index) => {
                const t = index / Math.max(1, tierCount - 1);
                const widthScaleAt = Math.max(0.5, widthScale - t * stepSpread);
                const depthScaleAt = Math.max(0.5, depthScale - t * stepSpread);
                return (_jsx(SquareBlock, { depth: node.depth * depthScaleAt, height: tierHeight * 1.01, width: node.width * widthScaleAt, y: index * tierHeight }, index));
            }) }));
    }
    if (baseStyle === 'round-rings') {
        const baseWidth = node.width * widthScale;
        const baseDepth = node.depth * depthScale;
        const plinthRatio = Math.min(0.7, Math.max(0.2, node.basePlinthHeightRatio ?? 0.44));
        const plinthHeight = height * plinthRatio;
        const roundedHeight = height - plinthHeight;
        const bandHeight = roundedHeight * 0.57;
        const neckHeight = roundedHeight - bandHeight;
        const bandScale = node.baseRoundBandScale ?? 0.92;
        const neckScale = node.baseNeckScale ?? 0.72;
        return (_jsxs("group", { children: [_jsx(SquareBlock, { depth: baseDepth, height: plinthHeight, width: baseWidth, y: 0 }), _jsx(OvalBlock, { depth: baseDepth * bandScale, height: bandHeight, segments: 32, width: baseWidth * bandScale, y: plinthHeight }), _jsx(OvalBlock, { depth: baseDepth * neckScale, height: neckHeight, segments: 32, width: baseWidth * neckScale, y: plinthHeight + bandHeight })] }));
    }
    if (baseStyle === 'lotus' || baseStyle === 'ribbed-lotus') {
        const ribCount = node.baseRibCount ?? (baseStyle === 'ribbed-lotus' ? 24 : 14);
        const ribRadius = Math.max(0.01, node.width * 0.025);
        const baseRadius = Math.max(node.radius * widthScale, node.width * widthScale * 0.5);
        return (_jsxs("group", { children: [_jsx(SquareBlock, { depth: node.depth * 1.28, height: height * 0.22, width: node.width * 1.28, y: 0 }), _jsx(RoundBlock, { height: height * 0.24, radius: baseRadius * 0.86, segments: 32, y: height * 0.22 }), Array.from({ length: ribCount }, (_, index) => {
                    const angle = (index / ribCount) * Math.PI * 2;
                    return (_jsx(MappedCylinder, { height: height * 0.38, position: [
                            Math.cos(angle) * baseRadius * 0.86,
                            height * 0.58,
                            Math.sin(angle) * baseRadius * 0.86,
                        ], radius: ribRadius, rotation: [0, -angle, 0], segments: 6 }, index));
                }), _jsx(RoundBlock, { height: height * 0.16, radius: baseRadius * 0.72, segments: 32, y: height * 0.82 })] }));
    }
    if (baseStyle === 'panelled-pedestal') {
        const inset = node.basePanelInset ?? 0.02;
        return (_jsxs("group", { children: [_jsx(SquareBlock, { depth: node.depth * widthScale, height: height, width: node.width * widthScale, y: 0 }), [
                    [0, node.depth * widthScale * 0.51, 0],
                    [0, -node.depth * widthScale * 0.51, 0],
                    [node.width * widthScale * 0.51, 0, Math.PI / 2],
                    [-node.width * widthScale * 0.51, 0, Math.PI / 2],
                ].map(([x, z, rotation], index) => (_jsx(MappedBox, { depth: inset, height: height * 0.42, position: [x, height * 0.5, z], rotation: [0, rotation, 0], softenEdges: false, width: node.width * 0.36 }, index)))] }));
    }
    return _jsx(ColumnBlock, { height: height, node: node, scale: 1.12, y: 0 });
}
function BaseCarvings({ node, height }) {
    const placement = node.carvingPlacement ?? 'capital';
    const carvingLevel = node.baseCarvingLevel ?? 0;
    if (carvingLevel <= 0 || height <= 0 || (placement !== 'base' && placement !== 'all')) {
        return null;
    }
    const count = Math.max(8, carvingLevel * 8);
    const radius = Math.max(node.radius * 1.04, Math.max(node.width, node.depth) * 0.5);
    const y = height * 0.52;
    return (_jsx("group", { children: Array.from({ length: count }, (_, index) => {
            const angle = (index / count) * Math.PI * 2;
            return (_jsx(MappedCone, { height: height * 0.28, position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius], radiusX: 0.014, radiusZ: 0.01, rotation: [0.36, -angle, 0], segments: 5 }, index));
        }) }));
}
function Rings({ node, shaftY, shaftHeight, }) {
    if (node.ringCount <= 0 || shaftHeight <= 0)
        return null;
    const ringPlacement = node.ringPlacement ?? 'ends';
    const ringSpread = Math.min(0.45, Math.max(0.04, node.ringSpread ?? 0.16));
    const ringHeight = Math.min(node.ringThickness ?? 0.055, shaftHeight / Math.max(8, node.ringCount * 3));
    const rings = Array.from({ length: node.ringCount }, (_, index) => {
        const pairIndex = Math.floor(index / 2);
        const nearTop = index % 2 === 1;
        const pairCount = Math.ceil(node.ringCount / 2);
        const pairT = pairCount <= 1 ? 0 : pairIndex / (pairCount - 1);
        const offset = Math.min(0.48, 0.06 + pairT * Math.max(0, ringSpread - 0.06));
        const oneSideT = 0.06 + (index / Math.max(1, node.ringCount - 1)) * Math.max(0, ringSpread - 0.06);
        const t = ringPlacement === 'even'
            ? (index + 1) / (node.ringCount + 1)
            : ringPlacement === 'top'
                ? 1 - Math.min(0.48, oneSideT)
                : ringPlacement === 'bottom'
                    ? Math.min(0.48, oneSideT)
                    : nearTop
                        ? 1 - offset
                        : offset;
        return {
            scale: Math.min(1.4, getShaftScaleAt(node, t) + 0.12),
            y: shaftY + shaftHeight * t - ringHeight / 2,
        };
    }).sort((a, b) => a.y - b.y);
    return (_jsx("group", { children: rings.map((ring, index) => (_jsx(ColumnBlock, { height: ringHeight, node: node, scale: ring.scale, y: ring.y }, index))) }));
}
function LatheBands({ node, shaftY, shaftHeight, }) {
    const latheRingCount = Math.max(node.latheRingCount ?? 0, node.shaftDetail === 'lathe-turned' ? 8 : 0);
    if (latheRingCount <= 0 || shaftHeight <= 0)
        return null;
    const placement = node.latheRingSpacing ?? 'ends';
    const bandHeight = Math.min(0.04, shaftHeight / Math.max(12, latheRingCount * 3));
    const bands = Array.from({ length: latheRingCount }, (_, index) => {
        const pairIndex = Math.floor(index / 2);
        const nearTop = index % 2 === 1;
        const offset = Math.min(0.48, 0.1 + pairIndex * 0.04);
        const t = placement === 'even'
            ? (index + 1) / (latheRingCount + 1)
            : placement === 'top'
                ? 1 - Math.min(0.48, 0.08 + index * 0.04)
                : placement === 'bottom'
                    ? Math.min(0.48, 0.08 + index * 0.04)
                    : nearTop
                        ? 1 - offset
                        : offset;
        return shaftY + shaftHeight * t - bandHeight / 2;
    }).sort((a, b) => a - b);
    return (_jsx("group", { children: bands.map((y, index) => (_jsx(ColumnBlock, { height: bandHeight, node: node, scale: 0.82 + (index % 2) * 0.08, y: y }, index))) }));
}
function Flutes({ node, shaftY, shaftHeight, }) {
    const fluteCount = Math.max(node.fluteCount, node.shaftDetail === 'fluted' ? 16 : 0);
    if (fluteCount <= 0 || shaftHeight <= 0 || node.crossSection !== 'round')
        return null;
    const fluteDepth = node.fluteDepth ?? 0.02;
    const fluteWidth = node.fluteWidth ?? fluteDepth;
    const fluteRadius = Math.max(0.006, fluteWidth * 0.42);
    const shaftRadius = node.radius * 0.74;
    return (_jsx("group", { children: Array.from({ length: fluteCount }, (_, index) => {
            const angle = (index / fluteCount) * Math.PI * 2;
            const x = Math.cos(angle) * shaftRadius;
            const z = Math.sin(angle) * shaftRadius;
            return (_jsx(MappedCylinder, { height: shaftHeight * 0.92, position: [x, shaftY + shaftHeight / 2, z], radius: fluteRadius, segments: 8 }, index));
        }) }));
}
function DravidianPanelFace({ position, rotation = 0, panelHeight, panelWidth, rail, reliefDepth, panelShape, }) {
    return (_jsxs("group", { position: position, rotation: [0, rotation, 0], children: [_jsx(MappedBox, { depth: reliefDepth, height: rail, position: [0, panelHeight / 2, 0], softenEdges: false, width: panelWidth }), _jsx(MappedBox, { depth: reliefDepth, height: rail, position: [0, -panelHeight / 2, 0], softenEdges: false, width: panelWidth }), _jsx(MappedBox, { depth: reliefDepth, height: panelHeight, position: [panelWidth / 2, 0, 0], softenEdges: false, width: rail }), _jsx(MappedBox, { depth: reliefDepth, height: panelHeight, position: [-panelWidth / 2, 0, 0], softenEdges: false, width: rail }), panelShape === 'diamond' && (_jsx(MappedBox, { depth: reliefDepth, height: panelHeight * 0.42, position: [0, 0, 0], rotation: [0, 0, Math.PI / 4], softenEdges: false, width: rail * 1.2 })), panelShape === 'arched' && (_jsx(MappedTorus, { arc: Math.PI, position: [0, panelHeight * 0.28, 0], ringRadius: panelWidth * 0.42, scaleX: panelWidth * 0.42, scaleY: rail, scaleZ: reliefDepth, tubeRadius: Math.max(rail, reliefDepth) * 0.18 }))] }));
}
function DravidianShaftPanels({ node, shaftY, shaftHeight, }) {
    const panelCount = Math.max(node.panelCount ?? 0, node.style === 'dravidian-carved' || node.shaftDetail === 'panelled' ? 3 : 0);
    if (panelCount <= 0 || shaftHeight <= 0)
        return null;
    const shaftWidth = node.width * 0.72;
    const shaftDepth = node.depth * 0.72;
    const panelHeight = Math.min(0.42, shaftHeight / Math.max(4, panelCount + 2));
    const panelWidth = node.width * 0.26;
    const rail = Math.max(0.012, node.width * 0.028);
    const reliefDepth = Math.max(0.012, node.panelInsetDepth ?? node.width * 0.025);
    const rows = Array.from({ length: panelCount }, (_, index) => (index + 1) / (panelCount + 1));
    const panelShape = node.panelShape ?? 'rectangle';
    const faceProps = { panelHeight, panelWidth, rail, reliefDepth, panelShape };
    return (_jsx("group", { children: rows.map((t, rowIndex) => {
            const y = shaftY + shaftHeight * t;
            return (_jsxs("group", { children: [_jsx(DravidianPanelFace, { position: [0, y, shaftDepth / 2 + reliefDepth / 2], ...faceProps }), _jsx(DravidianPanelFace, { position: [0, y, -shaftDepth / 2 - reliefDepth / 2], ...faceProps }), _jsx(DravidianPanelFace, { position: [shaftWidth / 2 + reliefDepth / 2, y, 0], rotation: Math.PI / 2, ...faceProps }), _jsx(DravidianPanelFace, { position: [-shaftWidth / 2 - reliefDepth / 2, y, 0], rotation: Math.PI / 2, ...faceProps })] }, rowIndex));
        }) }));
}
function SpiralRibs({ node, shaftY, shaftHeight, }) {
    const spiralRibCount = node.spiralRibCount ?? 0;
    const spiralTwist = node.spiralTwist ?? 0;
    const shaftTaper = node.shaftTaper ?? 0;
    const ribCountSetting = Math.max(spiralRibCount, node.shaftDetail === 'spiral' ? 12 : 0);
    if (ribCountSetting <= 0 || spiralTwist === 0 || shaftHeight <= 0)
        return null;
    const ribCount = Math.min(ribCountSetting, 24);
    const stepCount = 28;
    const ribDistance = node.radius * 0.78;
    const ribWidth = Math.max(0.012, node.radius * 0.06);
    const segmentHeight = (shaftHeight / stepCount) * 1.18;
    const lean = spiralTwist > 0 ? -0.55 : 0.55;
    return (_jsx("group", { children: Array.from({ length: ribCount * stepCount }, (_, index) => {
            const ribIndex = index % ribCount;
            const stepIndex = Math.floor(index / ribCount);
            const t = (stepIndex + 0.5) / stepCount;
            const angle = (ribIndex / ribCount) * Math.PI * 2 + t * spiralTwist * Math.PI * 2;
            const taperScale = 1 - Math.min(shaftTaper, 0.85) * t;
            return (_jsx(MappedCylinder, { height: segmentHeight, position: [
                    Math.cos(angle) * ribDistance * taperScale,
                    shaftY + shaftHeight * t,
                    Math.sin(angle) * ribDistance * taperScale,
                ], radius: ribWidth, rotation: [0, -angle, lean], segments: 8 }, index));
        }) }));
}
function LowerCarvedBand({ node, shaftY, shaftHeight, }) {
    const placement = node.carvingPlacement ?? 'capital';
    if (!node.lowerBandEnabled ||
        shaftHeight <= 0 ||
        (placement !== 'shaft' && placement !== 'all')) {
        return null;
    }
    const bandHeight = Math.min(node.lowerBandHeight ?? 0.24, shaftHeight * 0.35);
    const y = shaftY + shaftHeight * 0.12;
    const level = Math.max(1, node.lowerBandCarvingLevel ?? 1);
    const count = Math.max(6, level * 6);
    const distance = Math.max(node.radius * 0.82, Math.max(node.width, node.depth) * 0.36);
    return (_jsxs("group", { children: [_jsx(ColumnBlock, { height: bandHeight, node: node, scale: 0.84, y: y }), Array.from({ length: count }, (_, index) => {
                const angle = (index / count) * Math.PI * 2;
                return (_jsx(MappedCylinder, { height: bandHeight * 0.62, position: [
                        Math.cos(angle) * distance,
                        y + bandHeight * 0.5,
                        Math.sin(angle) * distance,
                    ], radius: 0.012, rotation: [0, -angle, 0], segments: 5 }, index));
            })] }));
}
function CapitalCarvings({ node, capitalY, capitalHeight, }) {
    const placement = node.carvingPlacement ?? 'capital';
    const carvingLevel = Math.max(node.carvingLevel ?? 0, node.capitalCarvingLevel ?? 0);
    const bandSetting = node.capitalBandCount ?? 0;
    if ((carvingLevel <= 0 && bandSetting <= 0) ||
        capitalHeight <= 0 ||
        (placement !== 'capital' && placement !== 'all')) {
        return null;
    }
    const level = Math.min(Math.max(carvingLevel, bandSetting > 0 ? 1 : 0), 4);
    const bandHeight = Math.min(0.035, capitalHeight / 8);
    const bandCount = Math.min(bandSetting > 0 ? bandSetting : level + 1, 16);
    const bands = Array.from({ length: bandCount }, (_, index) => {
        const t = (index + 1) / (bandCount + 1);
        return capitalY + capitalHeight * t - bandHeight / 2;
    });
    if (node.crossSection === 'square' || node.crossSection === 'rectangular') {
        const dentilCount = Math.max(node.dentilCount ?? 0, level * 4, 4);
        const dentilHeight = Math.min(0.08, capitalHeight * 0.28);
        const dentilDepth = Math.min(0.08, Math.min(node.width, node.depth) * 0.16);
        const dentilWidth = Math.max(0.025, node.width / (dentilCount * 1.75));
        const halfWidth = node.width * 0.56;
        const halfDepth = node.depth * 0.56;
        const y = capitalY + capitalHeight * 0.28;
        const xPositions = Array.from({ length: dentilCount }, (_, index) => {
            const t = dentilCount === 1 ? 0.5 : index / (dentilCount - 1);
            return -halfWidth + t * halfWidth * 2;
        });
        const zPositions = Array.from({ length: dentilCount }, (_, index) => {
            const t = dentilCount === 1 ? 0.5 : index / (dentilCount - 1);
            return -halfDepth + t * halfDepth * 2;
        });
        return (_jsxs("group", { children: [bands.map((bandY, index) => (_jsx(ColumnBlock, { height: bandHeight, node: node, scale: 1.28, y: bandY }, `band-${index}`))), xPositions.map((x, index) => (_jsxs("group", { children: [_jsx(MappedBox, { depth: dentilDepth, height: dentilHeight, position: [x, y, halfDepth], softenEdges: false, width: dentilWidth }), _jsx(MappedBox, { depth: dentilDepth, height: dentilHeight, position: [x, y, -halfDepth], softenEdges: false, width: dentilWidth })] }, `front-back-dentil-${index}`))), zPositions.map((z, index) => (_jsxs("group", { children: [_jsx(MappedBox, { depth: dentilWidth, height: dentilHeight, position: [halfWidth, y, z], softenEdges: false, width: dentilDepth }), _jsx(MappedBox, { depth: dentilWidth, height: dentilHeight, position: [-halfWidth, y, z], softenEdges: false, width: dentilDepth })] }, `side-dentil-${index}`)))] }));
    }
    const beadCount = Math.max(node.beadCount ?? 0, 8, level * 8);
    const beadRadius = Math.max(0.012, Math.min(0.03, node.radius * 0.12));
    const beadDistance = node.radius * 1.24;
    const beadY = capitalY + capitalHeight * 0.24;
    return (_jsxs("group", { children: [bands.map((bandY, index) => (_jsx(ColumnBlock, { height: bandHeight, node: node, scale: 1.24, y: bandY }, `band-${index}`))), Array.from({ length: beadCount }, (_, index) => {
                const angle = (index / beadCount) * Math.PI * 2;
                return (_jsx(MappedSphere, { position: [Math.cos(angle) * beadDistance, beadY, Math.sin(angle) * beadDistance], radius: beadRadius }, `bead-${index}`));
            })] }));
}
function Volutes({ node, capitalY, capitalHeight, }) {
    if (!['volute', 'ionic-volute'].includes(node.capitalStyle ?? 'simple') || capitalHeight <= 0)
        return null;
    const y = capitalY + capitalHeight * 0.62;
    const radius = node.voluteSize ?? Math.min(0.085, Math.max(0.04, node.width * 0.12));
    const x = node.width * 0.46;
    const z = node.depth * 0.7;
    const maxVolutes = Math.max(0, Math.min(node.voluteCount ?? 4, 8));
    const volutes = [
        {
            position: [x, y, z],
            rotation: [0, 0, 0],
        },
        {
            position: [-x, y, z],
            rotation: [0, 0, 0],
        },
        {
            position: [x, y, -z],
            rotation: [0, Math.PI, 0],
        },
        {
            position: [-x, y, -z],
            rotation: [0, Math.PI, 0],
        },
        {
            position: [z, y, x],
            rotation: [0, Math.PI / 2, 0],
        },
        {
            position: [z, y, -x],
            rotation: [0, Math.PI / 2, 0],
        },
        {
            position: [-z, y, x],
            rotation: [0, -Math.PI / 2, 0],
        },
        {
            position: [-z, y, -x],
            rotation: [0, -Math.PI / 2, 0],
        },
    ].slice(0, maxVolutes);
    return (_jsx("group", { children: volutes.map((volute, index) => (_jsx(MappedTorus, { position: volute.position, ringRadius: radius, rotation: volute.rotation, scaleZ: radius * 0.28, tubeRadius: radius * 0.18 }, index))) }));
}
function LeafCarvings({ node, capitalY, capitalHeight, }) {
    if (!['leaf-carved', 'corinthian-leaf'].includes(node.capitalStyle ?? 'simple') ||
        capitalHeight <= 0) {
        return null;
    }
    const leafCount = node.leafCount ?? (node.crossSection === 'round' ? 18 : 12);
    const distance = Math.max(node.radius * 1.05, Math.max(node.width, node.depth) * 0.48);
    const rowCount = Math.max(0, Math.min(node.leafRows ?? 2, 4));
    const rows = Array.from({ length: rowCount }, (_, index) => ({
        y: capitalY + capitalHeight * (0.3 + index * 0.16),
        scale: 0.28 - index * 0.04,
        offset: index % 2 === 0 ? 0 : Math.PI / leafCount,
    }));
    return (_jsx("group", { children: rows.flatMap((row, rowIndex) => Array.from({ length: leafCount }, (_, index) => {
            const angle = (index / leafCount) * Math.PI * 2 + row.offset;
            return (_jsx(MappedCone, { height: capitalHeight * row.scale, position: [Math.cos(angle) * distance, row.y, Math.sin(angle) * distance], radiusX: 0.018, radiusZ: 0.01, rotation: [0.48, -angle, 0], segments: 6 }, `${rowIndex}-${index}`));
        })) }));
}
function Capital({ node, y, height }) {
    if (height <= 0)
        return null;
    const capitalStyle = node.capitalStyle ?? 'simple';
    if (capitalStyle === 'none')
        return null;
    if (capitalStyle === 'south-indian-bracket' || capitalStyle === 'wood-bracket') {
        const tierCount = Math.max(1, node.bracketTierCount ?? 3);
        const tierHeight = height / tierCount;
        const bracketDepth = node.bracketDepth ?? 0.35;
        return (_jsxs("group", { children: [Array.from({ length: tierCount }, (_, index) => {
                    const t = index / Math.max(1, tierCount - 1);
                    const scale = (node.capitalWidthScale ?? 1.6) + t * 0.32;
                    return (_jsx(SquareBlock, { depth: node.depth * scale + bracketDepth * t, height: tierHeight, width: node.width * scale + bracketDepth * t, y: y + index * tierHeight }, index));
                }), Array.from({ length: node.pendantCount ?? 0 }, (_, index) => {
                    const count = Math.max(1, node.pendantCount ?? 0);
                    const angle = (index / count) * Math.PI * 2;
                    const distance = Math.max(node.width, node.depth) * 0.56;
                    return (_jsx(MappedCone, { height: height * 0.28, position: [Math.cos(angle) * distance, y - height * 0.1, Math.sin(angle) * distance], radiusX: 0.035, rotation: [0, 0, 0], segments: 6 }, index));
                })] }));
    }
    if (capitalStyle === 'rounded' || capitalStyle === 'doric') {
        const topWidth = node.width * (node.capitalWidthScale ?? 1.34);
        const topDepth = node.depth * (node.capitalDepthScale ?? node.capitalWidthScale ?? 1.34);
        return (_jsxs("group", { children: [_jsx(OvalBlock, { depth: topDepth * 0.72, height: height * 0.24, segments: 32, width: topWidth * 0.72, y: y }), _jsx(OvalBlock, { depth: topDepth * 0.92, height: height * 0.32, segments: 32, width: topWidth * 0.92, y: y + height * 0.24 }), _jsx(SquareBlock, { depth: topDepth, height: height * 0.44, width: topWidth, y: y + height * 0.56 })] }));
    }
    if (capitalStyle === 'stepped') {
        const widthScale = node.capitalWidthScale ?? 1.46;
        const depthScale = node.capitalDepthScale ?? widthScale;
        const tierCount = Math.max(3, node.capitalTierCount ?? 3);
        const tierHeight = height / tierCount;
        const stepSpread = node.capitalStepSpread ?? 0.42;
        return (_jsx("group", { children: Array.from({ length: tierCount }, (_, index) => {
                const t = index / Math.max(1, tierCount - 1);
                const widthScaleAt = Math.max(0.5, widthScale - (1 - t) * stepSpread);
                const depthScaleAt = Math.max(0.5, depthScale - (1 - t) * stepSpread);
                return (_jsx(SquareBlock, { depth: node.depth * depthScaleAt, height: tierHeight * 1.01, width: node.width * widthScaleAt, y: y + index * tierHeight }, index));
            }) }));
    }
    if (capitalStyle === 'volute' ||
        capitalStyle === 'ionic-volute' ||
        capitalStyle === 'leaf-carved' ||
        capitalStyle === 'corinthian-leaf') {
        const topWidth = node.width * (node.capitalWidthScale ?? 1.46);
        const topDepth = node.depth * (node.capitalDepthScale ?? node.capitalWidthScale ?? 1.46);
        return (_jsxs("group", { children: [_jsx(ColumnBlock, { height: height * 0.24, node: node, scale: 0.9, y: y }), _jsx(ColumnBlock, { height: height * 0.2, node: node, scale: 1.08, y: y + height * 0.24 }), _jsx(SquareBlock, { depth: topDepth, height: height * 0.28, width: topWidth, y: y + height * 0.44 }), _jsx(Volutes, { capitalHeight: height, capitalY: y, node: node }), _jsx(LeafCarvings, { capitalHeight: height, capitalY: y, node: node })] }));
    }
    const widthScale = node.capitalWidthScale ?? (capitalStyle === 'simple-slab' ? 1.28 : 1.18);
    const depthScale = node.capitalDepthScale ?? widthScale;
    if (node.crossSection === 'square' || node.crossSection === 'rectangular') {
        return (_jsx(SquareBlock, { depth: node.depth * depthScale, height: height, width: node.width * widthScale, y: y }));
    }
    return (_jsx(RoundBlock, { height: height, radius: Math.max(node.radius * widthScale, node.width * widthScale * 0.5), segments: getSegments(node), y: y }));
}
/**
 * The column's geometry tree — either a fabricated support frame or the
 * classical base / shaft / capital stack. Extracted from `ColumnRenderer`
 * so the translucent placement ghost (`ColumnPreview`) renders the exact
 * same shape without the registry registration, pointer handlers, or
 * live-transform wiring the real renderer layers on. Material and edge
 * softness arrive through context, so each caller controls appearance by
 * wrapping this in its own providers.
 */
function ColumnBody({ node }) {
    const shaftLayout = useMemo(() => {
        const baseHeight = node.baseStyle === 'none' ? 0 : Math.min(node.baseHeight, node.height * 0.4);
        const capitalHeight = node.capitalStyle === 'none' ? 0 : Math.min(node.capitalHeight, node.height * 0.4);
        const shaftHeight = Math.max(0.1, node.height - baseHeight - capitalHeight);
        return { baseHeight, capitalHeight, shaftY: baseHeight, shaftHeight };
    }, [node.baseHeight, node.baseStyle, node.capitalHeight, node.capitalStyle, node.height]);
    return node.supportStyle === 'a-frame' ? (_jsx(AFrameSupport, { node: node })) : node.supportStyle === 'y-frame' ? (_jsx(YFrameSupport, { node: node })) : node.supportStyle === 'v-frame' ? (_jsx(VFrameSupport, { node: node })) : node.supportStyle === 'x-brace' ? (_jsx(XBraceSupport, { node: node })) : node.supportStyle === 'k-brace' ? (_jsx(KBraceSupport, { node: node })) : node.supportStyle === 'single-strut' ? (_jsx(SingleStrutSupport, { node: node })) : node.supportStyle === 'tripod' ? (_jsx(TripodSupport, { node: node })) : node.supportStyle === 'trestle' ? (_jsx(TrestleSupport, { node: node })) : node.supportStyle === 'portal-frame' ? (_jsx(PortalFrameSupport, { node: node })) : node.supportStyle === 'box-frame' ? (_jsx(BoxFrameSupport, { node: node })) : (_jsxs(_Fragment, { children: [_jsx(Base, { height: shaftLayout.baseHeight, node: node }), _jsx(BaseCarvings, { height: shaftLayout.baseHeight, node: node }), _jsx(Shaft, { height: shaftLayout.shaftHeight, node: node, y: shaftLayout.shaftY }), _jsx(Rings, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(LatheBands, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(Flutes, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(LowerCarvedBand, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(DravidianShaftPanels, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(SpiralRibs, { node: node, shaftHeight: shaftLayout.shaftHeight, shaftY: shaftLayout.shaftY }), _jsx(Capital, { height: shaftLayout.capitalHeight, node: node, y: shaftLayout.baseHeight + shaftLayout.shaftHeight }), _jsx(CapitalCarvings, { capitalHeight: shaftLayout.capitalHeight, capitalY: shaftLayout.baseHeight + shaftLayout.shaftHeight, node: node })] }));
}
/**
 * Translucent, non-interactive ghost of a column — the placement tool's
 * cursor preview, mirroring `ShelfPreview`. Builds the same geometry tree
 * as the real renderer via `<ColumnBody>` but:
 *   - clones the material and makes it transparent (cloning is required:
 *     `createColumnMaterial` can hand back a shared/cached instance, and
 *     mutating it would turn every committed column see-through);
 *   - disables raycast on every mesh so the ghost doesn't intercept the
 *     placement cursor ray (which would stall `grid:move`);
 *   - renders at the local origin so the caller's cursor group positions it.
 */
export const ColumnPreview = ({ node }) => {
    const shading = useViewer((state) => state.shading);
    const textures = useViewer((state) => state.textures);
    const colorPreset = useViewer((state) => state.colorPreset);
    const groupRef = useRef(null);
    const material = useMemo(() => {
        const ghost = createColumnMaterial({
            material: node.material,
            materialPreset: node.materialPreset,
            shading,
            textures,
            colorPreset,
        }).clone();
        ghost.transparent = true;
        ghost.opacity = 0.5;
        ghost.depthWrite = false;
        return ghost;
    }, [shading, textures, colorPreset, node.material, node.materialPreset]);
    useEffect(() => () => material.dispose(), [material]);
    // Strip pointer events off the freshly-built meshes every render — the
    // geometry tree rebuilds when the ghost's dimensions change, so a one-shot
    // effect wouldn't cover later meshes.
    useEffect(() => {
        groupRef.current?.traverse((obj) => {
            ;
            obj.raycast = () => { };
        });
    });
    return (_jsx(ColumnMaterialContext.Provider, { value: material, children: _jsx(ColumnEdgeSoftnessContext.Provider, { value: node.edgeSoftness ?? 0.025, children: _jsx("group", { ref: groupRef, children: _jsx(ColumnBody, { node: node }) }) }) }));
};
export const ColumnRenderer = ({ node: rawNode }) => {
    const ref = useRef(null);
    // Merge any live drag override so width / depth / radius / height
    // arrows update the mesh on every pointer move, with zustand only
    // hearing the commit on release. Subscribes narrowly to this node's
    // override entry; unrelated writes don't re-render.
    const liveOverride = useLiveNodeOverrides((s) => s.overrides.get(rawNode.id));
    const node = useMemo(() => (liveOverride ? { ...rawNode, ...liveOverride } : rawNode), [rawNode, liveOverride]);
    const handlers = useNodeEvents(node, 'column');
    const liveTransform = useLiveTransforms((state) => state.get(node.id));
    const shading = useViewer((state) => state.shading);
    const textures = useViewer((state) => state.textures);
    const colorPreset = useViewer((state) => state.colorPreset);
    const material = useMemo(() => createColumnMaterial({
        material: node.material,
        materialPreset: node.materialPreset,
        shading,
        textures,
        colorPreset,
    }), [
        shading,
        textures,
        colorPreset,
        node.material,
        node.material?.preset,
        node.material?.properties,
        node.material?.texture,
        node.materialPreset,
    ]);
    useRegistry(node.id, node.type, ref);
    return (_jsx(ColumnMaterialContext.Provider, { value: material, children: _jsx(ColumnEdgeSoftnessContext.Provider, { value: node.edgeSoftness ?? 0.025, children: _jsx("group", { position: liveTransform?.position ?? node.position, ref: ref, rotation: [0, liveTransform?.rotation ?? node.rotation, 0], visible: node.visible, ...handlers, children: _jsx(ColumnBody, { node: node }) }) }) }));
};
export default ColumnRenderer;
