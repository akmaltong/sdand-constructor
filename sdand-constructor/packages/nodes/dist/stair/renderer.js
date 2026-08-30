'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLiveNodeOverrides, useRegistry, useScene, } from '@pascal-app/core';
import { createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, DEFAULT_STAIR_MATERIAL, getStairBodyMaterials, getStairRailingMaterial, NodeRenderer, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createPlaceholderGeometry } from '../shared/placeholder-geometry';
export const StairRenderer = ({ node: rawNode }) => {
    const ref = useRef(null);
    // Merge any live drag override into the node so curved/spiral geometry
    // (built declaratively in JSX below) rebuilds on every drag tick. The
    // resize arrows publish to `useLiveNodeOverrides` and only commit to
    // zustand on release — subscribing here turns those override writes
    // into the React re-renders that drive the visible mesh update.
    const liveOverride = useLiveNodeOverrides((s) => s.overrides.get(rawNode.id));
    const node = useMemo(() => (liveOverride ? { ...rawNode, ...liveOverride } : rawNode), [rawNode, liveOverride]);
    const isSegmentBasedStair = node.stairType === 'straight';
    useRegistry(node.id, 'stair', ref);
    useLayoutEffect(() => {
        useScene.getState().markDirty(node.id);
    }, [node.id]);
    const handlers = useNodeEvents(node, 'stair');
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    const material = useMemo(() => {
        if (!textures)
            return createSurfaceRoleMaterial('joinery', colorPreset);
        const presetMaterial = createMaterialFromPresetRef(node.materialPreset, shading);
        if (presetMaterial)
            return presetMaterial;
        const mat = node.material;
        if (!mat)
            return DEFAULT_STAIR_MATERIAL(shading);
        return createMaterial(mat, shading);
    }, [
        shading,
        node.materialPreset,
        node.material,
        node.material?.preset,
        node.material?.properties,
        node.material?.texture,
        textures,
        colorPreset,
    ]);
    const straightBodyMaterials = useMemo(() => getStairBodyMaterials(node, shading, textures, colorPreset), [node, shading, textures, colorPreset]);
    const railingMaterial = useMemo(() => getStairRailingMaterial(node, shading, textures, colorPreset), [node, shading, textures, colorPreset]);
    // 2 groups map 1:1 to the stair body's 2-material array (body + tread).
    const straightPlaceholderGeometry = useMemo(() => createPlaceholderGeometry(2), []);
    useEffect(() => {
        return () => {
            straightPlaceholderGeometry.dispose();
        };
    }, [straightPlaceholderGeometry]);
    return (_jsxs("group", { "position-x": node.position[0], "position-z": node.position[2], ref: ref, "rotation-y": node.rotation, visible: node.visible, ...handlers, children: [isSegmentBasedStair ? (_jsx("mesh", { castShadow: true, geometry: straightPlaceholderGeometry, material: straightBodyMaterials, name: "merged-stair", receiveShadow: true })) : null, isSegmentBasedStair ? null : (_jsx(CurvedStairBody, { bodyMaterials: straightBodyMaterials, stair: node })), _jsx(StairRailings, { material: railingMaterial, stair: node }), isSegmentBasedStair ? (_jsx("group", { name: "segments-wrapper", visible: false, children: (node.children ?? []).map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId))) })) : null] }));
};
function StairRailings({ stair, material }) {
    const nodes = useScene((state) => state.nodes);
    // Stair segments' width/length/height arrow handles publish drag values to
    // `useLiveNodeOverrides` and only commit to zustand on release. Subscribing
    // here and merging each child segment's override means the railing tracks
    // the drag in real time instead of freezing at the pre-drag values.
    const overrides = useLiveNodeOverrides((s) => s.overrides);
    const segments = useMemo(() => (stair.children ?? [])
        .map((childId) => {
        const base = nodes[childId];
        if (!base)
            return undefined;
        const override = overrides.get(childId);
        return (override ? { ...base, ...override } : base);
    })
        .filter((node) => node?.type === 'stair-segment' && node.visible !== false), [nodes, overrides, stair.children]);
    const railPaths = useMemo(() => buildStairRailPaths(segments, stair.railingMode ?? 'none'), [segments, stair.railingMode]);
    const railHeight = stair.railingHeight ?? 0.92;
    const midRailHeight = Math.max(railHeight * 0.45, 0.35);
    const railRadius = 0.022;
    const balusterRadius = 0.018;
    if ((stair.railingMode ?? 'none') === 'none') {
        return null;
    }
    if (stair.stairType === 'curved' || stair.stairType === 'spiral') {
        const stepCount = Math.max(2, Math.round(stair.stepCount ?? 10));
        const sweepAngle = stair.sweepAngle ?? (stair.stairType === 'spiral' ? Math.PI * 2 : Math.PI / 2);
        const stepSweep = sweepAngle / stepCount;
        const stepHeight = Math.max(stair.totalRise ?? 2.5, 0.1) / stepCount;
        const innerRadius = Math.max(stair.stairType === 'spiral' ? 0.05 : 0.2, stair.innerRadius ?? 0.9);
        const outerRadius = innerRadius + Math.max(stair.width ?? 1, 0.4);
        const leftRadius = sweepAngle >= 0 ? innerRadius + 0.04 : outerRadius - 0.04;
        const rightRadius = sweepAngle >= 0 ? outerRadius - 0.04 : innerRadius + 0.04;
        const radii = stair.railingMode === 'both'
            ? [leftRadius, rightRadius]
            : stair.railingMode === 'left'
                ? [leftRadius]
                : stair.railingMode === 'right'
                    ? [rightRadius]
                    : [];
        return (_jsx("group", { name: "stair-railing", children: radii.map((radius, sideIndex) => {
                const sidePoints = Array.from({ length: stepCount }).map((_, index) => {
                    const angle = -sweepAngle / 2 + stepSweep * index + stepSweep / 2;
                    return [
                        Math.cos(angle) * radius,
                        stair.stairType === 'spiral'
                            ? stepHeight * index + Math.max(stair.thickness ?? 0.25, 0.02)
                            : stepHeight * (index + 1),
                        Math.sin(angle) * radius,
                    ];
                });
                return (_jsxs("group", { children: [sidePoints.map((point, pointIndex) => (_jsx("mesh", { castShadow: true, geometry: BALUSTER_GEOMETRY, material: material, name: "stair-railing-baluster", position: [point[0], point[1] + railHeight / 2, point[2]], receiveShadow: true, scale: [balusterRadius, railHeight, balusterRadius] }, `${stair.id}-curved-baluster-${sideIndex}-${pointIndex}`))), sidePoints.slice(0, -1).map((point, pointIndex) => {
                            const nextPoint = sidePoints[pointIndex + 1];
                            if (!nextPoint)
                                return null;
                            return (_jsxs("group", { children: [_jsx(RailSegment, { end: [nextPoint[0], nextPoint[1] + railHeight, nextPoint[2]], material: material, radius: railRadius, start: [point[0], point[1] + railHeight, point[2]] }), _jsx(RailSegment, { end: [nextPoint[0], nextPoint[1] + midRailHeight, nextPoint[2]], material: material, radius: railRadius * 0.8, start: [point[0], point[1] + midRailHeight, point[2]] })] }, `${stair.id}-curved-rail-${sideIndex}-${pointIndex}`));
                        })] }, `${stair.id}-curved-railing-${sideIndex}`));
            }) }));
    }
    if (railPaths.length === 0) {
        return null;
    }
    return (_jsxs("group", { name: "stair-railing", children: [railPaths.map((segmentPath, index) => (_jsx("group", { position: [
                    segmentPath.layout.center[0],
                    segmentPath.layout.elevation,
                    segmentPath.layout.center[1],
                ], "rotation-y": segmentPath.layout.rotation, children: segmentPath.sidePaths.map((sidePath, sideIndex) => (_jsxs("group", { children: [sidePath.points.map((point, pointIndex) => (_jsx("mesh", { castShadow: true, geometry: BALUSTER_GEOMETRY, material: material, name: "stair-railing-baluster", position: [point[2], point[1] + railHeight / 2, point[0]], receiveShadow: true, scale: [balusterRadius, railHeight, balusterRadius] }, `${segmentPath.layout.segment.id}-${sidePath.side}-baluster-${pointIndex}`))), sidePath.points.slice(0, -1).map((point, pointIndex) => {
                            const nextPoint = sidePath.points[pointIndex + 1];
                            if (!nextPoint)
                                return null;
                            return (_jsxs("group", { children: [_jsx(RailSegment, { end: [nextPoint[2], nextPoint[1] + railHeight, nextPoint[0]], material: material, radius: railRadius, start: [point[2], point[1] + railHeight, point[0]] }), _jsx(RailSegment, { end: [nextPoint[2], nextPoint[1] + midRailHeight, nextPoint[0]], material: material, radius: railRadius * 0.8, start: [point[2], point[1] + midRailHeight, point[0]] })] }, `${segmentPath.layout.segment.id}-${sidePath.side}-rail-${pointIndex}`));
                        })] }, `${segmentPath.layout.segment.id}-${sidePath.side}-${sideIndex}`))) }, `${segmentPath.layout.segment.id}-railing`))), railPaths.slice(1).map((segmentPath, index) => {
                const previousPath = railPaths[index];
                if (!(previousPath && segmentPath.connectFromPrevious))
                    return null;
                if (previousPath.layout.segment.segmentType === 'landing')
                    return null;
                if (segmentPath.layout.segment.segmentType === 'landing')
                    return null;
                return segmentPath.sidePaths.map((sidePath, sideIndex) => {
                    const currentPoint = sidePath.points[0];
                    if (!currentPoint)
                        return null;
                    const currentWorldPoint = toWorldRailPoint(segmentPath.layout, currentPoint);
                    const previousSidePath = [...previousPath.sidePaths]
                        .map((entry) => {
                        const lastPoint = entry.points[entry.points.length - 1];
                        return {
                            entry,
                            distance: lastPoint
                                ? distance3(toWorldRailPoint(previousPath.layout, lastPoint), currentWorldPoint)
                                : Number.POSITIVE_INFINITY,
                        };
                    })
                        .sort((left, right) => left.distance - right.distance)[0]?.entry;
                    const previousPoint = previousSidePath?.points.length
                        ? previousSidePath.points[previousSidePath.points.length - 1]
                        : null;
                    if (!(previousPoint && currentPoint)) {
                        return null;
                    }
                    const previousWorldPoint = toWorldRailPoint(previousPath.layout, previousPoint);
                    return (_jsxs("group", { children: [_jsx(RailSegment, { end: [
                                    currentWorldPoint[0],
                                    currentWorldPoint[1] + railHeight,
                                    currentWorldPoint[2],
                                ], material: material, radius: railRadius, start: [
                                    previousWorldPoint[0],
                                    previousWorldPoint[1] + railHeight,
                                    previousWorldPoint[2],
                                ] }), _jsx(RailSegment, { end: [
                                    currentWorldPoint[0],
                                    currentWorldPoint[1] + midRailHeight,
                                    currentWorldPoint[2],
                                ], material: material, radius: railRadius * 0.8, start: [
                                    previousWorldPoint[0],
                                    previousWorldPoint[1] + midRailHeight,
                                    previousWorldPoint[2],
                                ] })] }, `${previousPath.layout.segment.id}-${segmentPath.layout.segment.id}-${sideIndex}`));
                });
            })] }));
}
const BALUSTER_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 8);
const RAIL_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 8);
const STAIR_TREAD_MATERIAL_INDEX = 0;
const STAIR_SIDE_MATERIAL_INDEX = 1;
function RailSegment({ start, end, radius, material, }) {
    const startVector = useMemo(() => new THREE.Vector3(...start), [start]);
    const endVector = useMemo(() => new THREE.Vector3(...end), [end]);
    const direction = useMemo(() => endVector.clone().sub(startVector), [endVector, startVector]);
    const length = Math.max(direction.length(), 0.01);
    const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), [direction]);
    const midpoint = useMemo(() => startVector.clone().add(endVector).multiplyScalar(0.5), [endVector, startVector]);
    return (_jsx("mesh", { castShadow: true, geometry: RAIL_GEOMETRY, material: material, name: "stair-railing-rail", position: [midpoint.x, midpoint.y, midpoint.z], quaternion: quaternion, receiveShadow: true, scale: [Math.max(radius, 0.01), length, Math.max(radius, 0.01)] }));
}
function CurvedStairBody({ stair, bodyMaterials, }) {
    const sideMaterial = bodyMaterials[1];
    const stepCount = Math.max(2, Math.round(stair.stepCount ?? 10));
    const totalRise = Math.max(stair.totalRise ?? 2.5, 0.1);
    const stepHeight = totalRise / stepCount;
    const isSpiral = stair.stairType === 'spiral';
    const innerRadius = Math.max(isSpiral ? 0.05 : 0.2, stair.innerRadius ?? 0.9);
    const outerRadius = innerRadius + Math.max(stair.width ?? 1, 0.4);
    const sweepAngle = stair.sweepAngle ?? (isSpiral ? Math.PI * 2 : Math.PI / 2);
    const stepSweep = sweepAngle / stepCount;
    const thickness = Math.max(stair.thickness ?? 0.25, 0.02);
    const fillToFloor = stair.fillToFloor ?? true;
    const spiralColumnRadius = Math.max(0.05, Math.min(innerRadius * 0.72, innerRadius - 0.03));
    const spiralColumnHeight = totalRise + thickness;
    const spiralLandingDepth = Math.max(0.3, stair.topLandingDepth ?? Math.max((stair.width ?? 1) * 0.9, 0.8));
    const spiralLandingSweep = isSpiral && (stair.topLandingMode ?? 'none') === 'integrated'
        ? Math.min(Math.PI * 0.75, spiralLandingDepth / Math.max(innerRadius + (stair.width ?? 1) / 2, 0.1)) * Math.sign(sweepAngle || 1)
        : 0;
    const spiralLastStepTop = stepHeight * Math.max(stepCount - 1, 0) + thickness;
    const spiralLandingThickness = isSpiral && (stair.topLandingMode ?? 'none') === 'integrated'
        ? Math.max(0.02, totalRise - spiralLastStepTop)
        : 0;
    return (_jsxs("group", { name: isSpiral ? 'spiral-stair' : 'curved-stair', children: [isSpiral && (stair.showCenterColumn ?? true) ? (_jsx(SpiralColumnMesh, { height: spiralColumnHeight, material: sideMaterial, radius: spiralColumnRadius })) : null, Array.from({ length: stepCount }).map((_, index) => {
                const currentHeight = stepHeight * (index + 1);
                const actualStepHeight = isSpiral
                    ? thickness
                    : fillToFloor
                        ? Math.max(currentHeight, thickness)
                        : thickness;
                const startAngle = -sweepAngle / 2 + stepSweep * index;
                const endAngle = startAngle + stepSweep;
                const stepY = isSpiral
                    ? stepHeight * index
                    : fillToFloor
                        ? 0
                        : Math.max(currentHeight - thickness, 0);
                const midAngle = startAngle + stepSweep / 2;
                return (_jsxs("group", { "position-y": stepY, children: [isSpiral && (stair.showStepSupports ?? true) ? (_jsx(SpiralStepSupportMesh, { innerRadius: innerRadius, material: sideMaterial, midAngle: midAngle, spiralColumnRadius: spiralColumnRadius, thickness: thickness })) : null, _jsx(CurvedStepMesh, { endAngle: endAngle, innerRadius: innerRadius, material: bodyMaterials, outerRadius: outerRadius, positionY: 0, startAngle: startAngle, stepHeight: actualStepHeight, thickness: thickness })] }, `${stair.id}-${isSpiral ? 'spiral' : 'curved'}-step-${index}`));
            }), isSpiral && (stair.topLandingMode ?? 'none') === 'integrated' ? (_jsx(CurvedStepMesh, { endAngle: sweepAngle / 2 + spiralLandingSweep, innerRadius: innerRadius, material: bodyMaterials, outerRadius: outerRadius, positionY: spiralLastStepTop, startAngle: sweepAngle / 2, stepHeight: spiralLandingThickness, thickness: spiralLandingThickness })) : null] }));
}
function CurvedStepMesh({ innerRadius, outerRadius, startAngle, endAngle, stepHeight, thickness, positionY, material, }) {
    const geometry = useMemo(() => buildCurvedStepGeometry(innerRadius, outerRadius, startAngle, endAngle, Math.max(stepHeight, thickness)), [endAngle, innerRadius, outerRadius, startAngle, stepHeight, thickness]);
    // Dispose the prior BufferGeometry as soon as a new one supersedes it.
    // Resize drags (in 2D or 3D) rebuild this geometry every pointer move;
    // without explicit disposal, WebGPU keeps a stale pipeline reference to
    // the old vertex buffer and flags "Vertex buffer slot 0 required by
    // [RenderPipeline ...MeshLambertNodeMaterial...] was not set" on the
    // submit after the swap. Same mitigation as guide/renderer.tsx.
    useEffect(() => () => {
        geometry.dispose();
    }, [geometry]);
    return (_jsx("mesh", { castShadow: true, geometry: geometry, material: material, "position-y": positionY, receiveShadow: true }));
}
/**
 * Spiral center column. The cylinder is rebuilt whenever
 * `spiralColumnRadius` changes — i.e. on every tick of an inner-radius
 * drag. We pass the geometry as a prop (avoiding R3F's empty-placeholder
 * frame from inline JSX) and dispose the prior one on swap, matching the
 * pattern in guide/renderer.tsx. Without this WebGPU flags
 * "Vertex buffer slot 0 ... was not set" on Lambert mid-resize.
 */
function SpiralColumnMesh({ radius, height, material, }) {
    const geometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, height, 10), [radius, height]);
    useEffect(() => () => {
        geometry.dispose();
    }, [geometry]);
    return (_jsx("mesh", { castShadow: true, geometry: geometry, material: material, name: "stair-side", position: [0, height / 2, 0], receiveShadow: true }));
}
/**
 * Spiral step support — the small box wedged between the column and the
 * inner rim of each step. Same prop-+-dispose pattern as
 * `SpiralColumnMesh`: the box dimensions change every inner-radius tick
 * (`innerRadius - spiralColumnRadius`), so inline-JSX geometry would
 * trigger the Lambert vertex-buffer error.
 */
function SpiralStepSupportMesh({ innerRadius, spiralColumnRadius, midAngle, thickness, material, }) {
    const sizeX = Math.max(0.04, innerRadius - spiralColumnRadius + 0.04);
    const sizeY = Math.max(thickness * 0.55, 0.025);
    const sizeZ = Math.max(0.04, Math.min(0.12, sizeY * 1.5));
    const geometry = useMemo(() => new THREE.BoxGeometry(sizeX, sizeY, sizeZ), [sizeX, sizeY, sizeZ]);
    useEffect(() => () => {
        geometry.dispose();
    }, [geometry]);
    const radial = spiralColumnRadius + sizeX / 2 - 0.02;
    return (_jsx("mesh", { castShadow: true, geometry: geometry, material: material, name: "stair-side", position: [Math.cos(midAngle) * radial, sizeY / 2, Math.sin(midAngle) * radial], receiveShadow: true, "rotation-y": -midAngle }));
}
function buildCurvedStepGeometry(innerRadius, outerRadius, startAngle, endAngle, height) {
    const clampedHeight = Math.max(height, 0.02);
    const y0 = 0;
    const y1 = clampedHeight;
    const sweepAngle = endAngle - startAngle;
    const sweepDirection = Math.sign(sweepAngle) || 1;
    const segmentCount = Math.max(4, Math.min(24, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 18) + Math.max(0, (outerRadius - innerRadius) * 3))));
    const positions = [];
    const normals = [];
    const uvs = [];
    const triangleMaterialIndices = [];
    const pointOnArc = (radius, angle, y) => new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const pushUv = (point, normal, materialIndex) => {
        if (materialIndex === STAIR_TREAD_MATERIAL_INDEX) {
            const angle = Math.atan2(point.z, point.x);
            const arcOffset = (angle - startAngle) * Math.max((innerRadius + outerRadius) * 0.5, 0.01);
            uvs.push(arcOffset, Math.sqrt(point.x * point.x + point.z * point.z) - innerRadius);
            return;
        }
        const absX = Math.abs(normal.x);
        const absY = Math.abs(normal.y);
        const absZ = Math.abs(normal.z);
        if (absY >= absX && absY >= absZ) {
            uvs.push(point.x, point.z);
        }
        else if (absX >= absZ) {
            uvs.push(point.z, point.y);
        }
        else {
            uvs.push(point.x, point.y);
        }
    };
    const pushTriangle = (a, b, c, normal, materialIndex) => {
        const edgeAB = b.clone().sub(a);
        const edgeAC = c.clone().sub(a);
        const faceNormal = edgeAB.cross(edgeAC);
        const ordered = faceNormal.dot(normal) >= 0 ? [a, b, c] : [a, c, b];
        for (const point of ordered) {
            positions.push(point.x, point.y, point.z);
            normals.push(normal.x, normal.y, normal.z);
            pushUv(point, normal, materialIndex);
        }
        triangleMaterialIndices.push(materialIndex);
    };
    const pushQuad = (a, b, c, d, normal, materialIndex) => {
        pushTriangle(a, b, c, normal, materialIndex);
        pushTriangle(a, c, d, normal, materialIndex);
    };
    const upNormal = new THREE.Vector3(0, 1, 0);
    const downNormal = new THREE.Vector3(0, -1, 0);
    for (let index = 0; index < segmentCount; index++) {
        const t0 = index / segmentCount;
        const t1 = (index + 1) / segmentCount;
        const segStart = startAngle + sweepAngle * t0;
        const segEnd = startAngle + sweepAngle * t1;
        const midAngle = (segStart + segEnd) / 2;
        const innerStartBottom = pointOnArc(innerRadius, segStart, y0);
        const innerEndBottom = pointOnArc(innerRadius, segEnd, y0);
        const outerStartBottom = pointOnArc(outerRadius, segStart, y0);
        const outerEndBottom = pointOnArc(outerRadius, segEnd, y0);
        const innerStartTop = pointOnArc(innerRadius, segStart, y1);
        const innerEndTop = pointOnArc(innerRadius, segEnd, y1);
        const outerStartTop = pointOnArc(outerRadius, segStart, y1);
        const outerEndTop = pointOnArc(outerRadius, segEnd, y1);
        const outerNormal = new THREE.Vector3(Math.cos(midAngle), 0, Math.sin(midAngle)).normalize();
        const innerNormal = new THREE.Vector3(-Math.cos(midAngle), 0, -Math.sin(midAngle)).normalize();
        pushQuad(innerStartTop, outerStartTop, outerEndTop, innerEndTop, upNormal, STAIR_TREAD_MATERIAL_INDEX);
        pushQuad(innerStartBottom, innerEndBottom, outerEndBottom, outerStartBottom, downNormal, STAIR_SIDE_MATERIAL_INDEX);
        pushQuad(innerStartBottom, innerStartTop, innerEndTop, innerEndBottom, innerNormal, STAIR_SIDE_MATERIAL_INDEX);
        pushQuad(outerStartBottom, outerEndBottom, outerEndTop, outerStartTop, outerNormal, STAIR_SIDE_MATERIAL_INDEX);
    }
    const startInnerBottom = pointOnArc(innerRadius, startAngle, y0);
    const startOuterBottom = pointOnArc(outerRadius, startAngle, y0);
    const startInnerTop = pointOnArc(innerRadius, startAngle, y1);
    const startOuterTop = pointOnArc(outerRadius, startAngle, y1);
    const endInnerBottom = pointOnArc(innerRadius, endAngle, y0);
    const endOuterBottom = pointOnArc(outerRadius, endAngle, y0);
    const endInnerTop = pointOnArc(innerRadius, endAngle, y1);
    const endOuterTop = pointOnArc(outerRadius, endAngle, y1);
    const startNormal = new THREE.Vector3(sweepDirection * Math.sin(startAngle), 0, -sweepDirection * Math.cos(startAngle)).normalize();
    const endNormal = new THREE.Vector3(-sweepDirection * Math.sin(endAngle), 0, sweepDirection * Math.cos(endAngle)).normalize();
    pushQuad(startInnerBottom, startOuterBottom, startOuterTop, startInnerTop, startNormal, STAIR_SIDE_MATERIAL_INDEX);
    pushQuad(endInnerBottom, endInnerTop, endOuterTop, endOuterBottom, endNormal, STAIR_SIDE_MATERIAL_INDEX);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.clearGroups();
    let currentMaterial = triangleMaterialIndices[0];
    let groupStart = 0;
    for (let triangleIndex = 1; triangleIndex < triangleMaterialIndices.length; triangleIndex++) {
        const materialIndex = triangleMaterialIndices[triangleIndex];
        if (materialIndex === currentMaterial)
            continue;
        geometry.addGroup(groupStart * 3, (triangleIndex - groupStart) * 3, currentMaterial);
        groupStart = triangleIndex;
        currentMaterial = materialIndex;
    }
    if (triangleMaterialIndices.length > 0) {
        geometry.addGroup(groupStart * 3, (triangleMaterialIndices.length - groupStart) * 3, currentMaterial ?? STAIR_SIDE_MATERIAL_INDEX);
    }
    geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs.slice(), 2));
    geometry.computeVertexNormals();
    return geometry;
}
function buildStairRailPaths(segments, railingMode) {
    if (!segments.length || railingMode === 'none')
        return [];
    const layouts = computeStairRailLayouts(segments);
    const landingInset = 0.08;
    if (railingMode === 'both') {
        const isStraightLineDoubleLandingLayout = layouts.length === 4 &&
            layouts[0]?.segment.segmentType === 'stair' &&
            layouts[1]?.segment.segmentType === 'landing' &&
            layouts[2]?.segment.segmentType === 'stair' &&
            layouts[2]?.segment.attachmentSide === 'front' &&
            layouts[3]?.segment.segmentType === 'landing' &&
            layouts[3]?.segment.attachmentSide === 'front';
        return layouts.map((layout, index) => {
            const previousLayout = index > 0 ? layouts[index - 1] : undefined;
            const nextLayout = layouts[index + 1];
            const { nextStairLayout, isTerminalLandingBeforeStair } = resolveLandingChainNextStair(layouts, index);
            const hideLandingRailing = layout.segment.segmentType === 'landing' &&
                previousLayout?.segment.segmentType === 'stair' &&
                nextLayout?.segment.segmentType === 'stair';
            const visualTurnSide = isTerminalLandingBeforeStair && nextStairLayout?.segment.attachmentSide
                ? nextStairLayout.segment.attachmentSide
                : nextLayout?.segment.attachmentSide;
            const sideCandidates = isTerminalLandingBeforeStair && layout.segment.segmentType === 'landing'
                ? visualTurnSide === 'left'
                    ? ['front', 'right']
                    : visualTurnSide === 'right'
                        ? ['front', 'left']
                        : ['left', 'right']
                : hideLandingRailing
                    ? visualTurnSide === 'left'
                        ? ['front', 'right']
                        : visualTurnSide === 'right'
                            ? ['front', 'left']
                            : ['left', 'right']
                    : layout.segment.segmentType === 'landing'
                        ? nextLayout?.segment.segmentType === 'landing' && visualTurnSide === 'left'
                            ? ['front', 'right']
                            : nextLayout?.segment.segmentType === 'landing' && visualTurnSide === 'right'
                                ? ['front', 'left']
                                : visualTurnSide === 'left'
                                    ? ['right']
                                    : visualTurnSide === 'right'
                                        ? ['left']
                                        : ['left', 'right']
                        : ['left', 'right'];
            return {
                layout,
                sidePaths: isStraightLineDoubleLandingLayout && index === 1
                    ? ['left', 'right'].map((side) => buildSegmentRailPath(layouts, index, side, landingInset))
                    : sideCandidates.map((side) => buildSegmentRailPath(layouts, index, side, landingInset)),
                connectFromPrevious: index > 0 &&
                    !(previousLayout?.segment.segmentType === 'landing' &&
                        layout.segment.segmentType === 'landing'),
            };
        });
    }
    const isStraightLineDoubleLandingLayout = layouts.length === 4 &&
        layouts[0]?.segment.segmentType === 'stair' &&
        layouts[1]?.segment.segmentType === 'landing' &&
        layouts[2]?.segment.segmentType === 'stair' &&
        layouts[2]?.segment.attachmentSide === 'front' &&
        layouts[3]?.segment.segmentType === 'landing' &&
        layouts[3]?.segment.attachmentSide === 'front';
    return layouts.map((layout, index) => {
        const previousLayout = index > 0 ? layouts[index - 1] : undefined;
        const nextLayout = layouts[index + 1];
        const { nextStairLayout, isTerminalLandingBeforeStair } = resolveLandingChainNextStair(layouts, index);
        const isMiddleLandingBetweenFlights = layout.segment.segmentType === 'landing' &&
            previousLayout?.segment.segmentType === 'stair' &&
            nextLayout?.segment.segmentType === 'stair';
        const nextAttachmentSide = nextLayout?.segment.attachmentSide;
        const terminalNextAttachmentSide = nextStairLayout?.segment.attachmentSide;
        const suppressMiddleLandingOnPreferredTurnSide = isMiddleLandingBetweenFlights &&
            nextAttachmentSide != null &&
            nextAttachmentSide !== 'front' &&
            nextAttachmentSide === railingMode;
        const suppressLandingRailing = (layout.segment.segmentType === 'landing' &&
            nextLayout?.segment.segmentType === 'landing' &&
            nextAttachmentSide === railingMode) ||
            suppressMiddleLandingOnPreferredTurnSide;
        const landingContinuesOnPreferredSide = layout.segment.segmentType === 'landing'
            ? nextAttachmentSide == null ||
                nextAttachmentSide === 'front' ||
                nextAttachmentSide === railingMode
            : true;
        const sideCandidates = suppressLandingRailing
            ? []
            : layout.segment.segmentType !== 'landing'
                ? [railingMode]
                : isTerminalLandingBeforeStair
                    ? railingMode === 'left'
                        ? terminalNextAttachmentSide === 'right'
                            ? ['front', 'left']
                            : terminalNextAttachmentSide === 'front' || terminalNextAttachmentSide == null
                                ? ['left']
                                : []
                        : railingMode === 'right'
                            ? terminalNextAttachmentSide === 'left'
                                ? ['front', 'right']
                                : terminalNextAttachmentSide === 'front' || terminalNextAttachmentSide == null
                                    ? ['right']
                                    : []
                            : [railingMode]
                    : isStraightLineDoubleLandingLayout
                        ? [railingMode]
                        : isMiddleLandingBetweenFlights && railingMode === 'left'
                            ? nextAttachmentSide === 'right'
                                ? ['front', 'left']
                                : ['left']
                            : isMiddleLandingBetweenFlights && railingMode === 'right'
                                ? nextAttachmentSide === 'left'
                                    ? ['front', 'right']
                                    : ['right']
                                : nextLayout?.segment.segmentType === 'landing' &&
                                    nextAttachmentSide != null &&
                                    nextAttachmentSide !== 'front' &&
                                    nextAttachmentSide !== railingMode
                                    ? ['front', railingMode]
                                    : [railingMode];
        return {
            layout,
            sidePaths: sideCandidates.map((side) => buildSegmentRailPath(layouts, index, side, landingInset)),
            connectFromPrevious: index > 0 &&
                !suppressLandingRailing &&
                sideCandidates.length > 0 &&
                (layout.segment.segmentType === 'landing' ? landingContinuesOnPreferredSide : true),
        };
    });
}
function resolveLandingChainNextStair(layouts, index) {
    const layout = layouts[index];
    if (!layout || layout.segment.segmentType !== 'landing') {
        return { isTerminalLandingBeforeStair: false };
    }
    let cursor = index;
    while (cursor + 1 < layouts.length && layouts[cursor + 1]?.segment.segmentType === 'landing') {
        cursor += 1;
    }
    const nextStairLayout = cursor + 1 < layouts.length && layouts[cursor + 1]?.segment.segmentType === 'stair'
        ? layouts[cursor + 1]
        : undefined;
    return {
        nextStairLayout,
        isTerminalLandingBeforeStair: Boolean(nextStairLayout) && cursor === index,
    };
}
function computeStairRailLayouts(segments) {
    const transforms = computeSegmentTransforms(segments);
    return segments.map((segment, index) => {
        const transform = transforms[index];
        const [centerOffsetX, centerOffsetZ] = rotateXZ(0, segment.length / 2, transform.rotation);
        return {
            center: [transform.position[0] + centerOffsetX, transform.position[2] + centerOffsetZ],
            elevation: transform.position[1],
            rotation: transform.rotation,
            segment,
        };
    });
}
function buildSegmentRailPath(layouts, layoutIndex, side, landingInset) {
    const layout = layouts[layoutIndex];
    const segment = layout.segment;
    const previousLayout = layoutIndex > 0 ? layouts[layoutIndex - 1] : undefined;
    const nextLayout = layoutIndex >= 0 ? layouts[layoutIndex + 1] : undefined;
    const steps = Math.max(1, segment.segmentType === 'landing' ? 1 : segment.stepCount);
    const stepDepth = segment.length / steps;
    const stepHeight = segment.segmentType === 'landing' ? 0 : segment.height / steps;
    const flightSideOffset = side === 'left' ? segment.width / 2 - 0.045 : -segment.width / 2 + 0.045;
    const flightStartX = previousLayout?.segment.segmentType === 'landing'
        ? -segment.length / 2 + landingInset
        : -segment.length / 2;
    const flightEndX = nextLayout?.segment.segmentType === 'landing'
        ? segment.length / 2 - landingInset
        : segment.length / 2;
    const landingFrontX = previousLayout?.segment.segmentType === 'stair' &&
        segment.attachmentSide &&
        segment.attachmentSide !== 'front'
        ? -segment.length / 2 + landingInset
        : segment.length / 2 - landingInset;
    if (segment.segmentType === 'landing') {
        const backX = -segment.length / 2 + landingInset;
        const frontX = segment.length / 2 - landingInset;
        const leftZ = segment.width / 2 - landingInset;
        const rightZ = -segment.width / 2 + landingInset;
        return {
            side,
            points: side === 'left'
                ? [
                    [backX, 0, leftZ],
                    [frontX, 0, leftZ],
                ]
                : side === 'right'
                    ? [
                        [backX, 0, rightZ],
                        [frontX, 0, rightZ],
                    ]
                    : [
                        [landingFrontX, 0, leftZ],
                        [landingFrontX, 0, rightZ],
                    ],
        };
    }
    return {
        side,
        points: [
            ...(previousLayout?.segment.segmentType === 'landing'
                ? []
                : [[flightStartX, stepHeight > 0 ? stepHeight : 0, flightSideOffset]]),
            ...Array.from({ length: steps }).map((_, index) => [
                -segment.length / 2 + stepDepth * index + stepDepth / 2,
                stepHeight * (index + 1),
                flightSideOffset,
            ]),
            ...(nextLayout?.segment.segmentType === 'landing'
                ? []
                : [[flightEndX, segment.height, flightSideOffset]]),
        ],
    };
}
function toWorldRailPoint(layout, point) {
    const [localX, localY, localZ] = point;
    const [offsetX, offsetZ] = rotateXZ(localZ, localX, layout.rotation);
    return [layout.center[0] + offsetX, layout.elevation + localY, layout.center[1] + offsetZ];
}
function computeSegmentTransforms(segments) {
    const transforms = [];
    let currentPos = new THREE.Vector3(0, 0, 0);
    let currentRot = 0;
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i === 0) {
            transforms.push({
                position: [currentPos.x, currentPos.y, currentPos.z],
                rotation: currentRot,
            });
            continue;
        }
        const prev = segments[i - 1];
        const localAttachPos = new THREE.Vector3();
        let rotChange = 0;
        switch (segment.attachmentSide) {
            case 'front':
                localAttachPos.set(0, prev.height, prev.length);
                break;
            case 'left':
                localAttachPos.set(prev.width / 2, prev.height, prev.length / 2);
                rotChange = Math.PI / 2;
                break;
            case 'right':
                localAttachPos.set(-prev.width / 2, prev.height, prev.length / 2);
                rotChange = -Math.PI / 2;
                break;
        }
        localAttachPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRot);
        currentPos = currentPos.clone().add(localAttachPos);
        currentRot += rotChange;
        transforms.push({ position: [currentPos.x, currentPos.y, currentPos.z], rotation: currentRot });
    }
    return transforms;
}
function rotateXZ(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos + z * sin, -x * sin + z * cos];
}
function distance3(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
export default StairRenderer;
