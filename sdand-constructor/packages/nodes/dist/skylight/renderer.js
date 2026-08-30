'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { SKYLIGHT_TYPE_PRESETS, useInteractive, useLiveNodeOverrides, useRegistry, useScene, } from '@pascal-app/core';
import { createMaterial, createMaterialFromPresetRef, createSurfaceRoleMaterial, getRoofOuterSurfaceFrameAtPoint, useNodeEvents, useViewer, } from '@pascal-app/viewer';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { surfaceQuatFromNormal } from '../shared/roof-surface';
import { buildFrameGeometry } from './frame-csg';
import { buildLanternGlassGeometry, clamp01, paneSize } from './geometry';
const yAxis = new THREE.Vector3(0, 1, 0);
const defaultFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff_ff_ff,
    roughness: 0.3,
    metalness: 0.5,
});
// MeshBasicMaterial: only requires position (slot 0). Safe with DoubleSide
// because Basic doesn't write to the additional MRT targets that
// MeshStandardMaterial/Physical do, so the WebGPU "writeMask not zero"
// error doesn't fire. Also avoids the "vertex buffer slot 1 not set" error
// that MeshLambertNodeMaterial triggers when inline <boxGeometry> JSX
// recreates geometry on resize — the node-material pipeline expects normals
// in slot 1, but the new geometry instance isn't fully bound yet at draw time.
// MeshBasicMaterial at 30% opacity gives visually identical glass without
// those constraints.
const defaultGlassMaterial = new THREE.MeshBasicMaterial({
    color: 0x87_ce_eb,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
});
function FrameBar({ end, material, radius, start, }) {
    const transform = useMemo(() => {
        const startPoint = new THREE.Vector3(...start);
        const endPoint = new THREE.Vector3(...end);
        const direction = endPoint.clone().sub(startPoint);
        const length = direction.length();
        const midpoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
        const quaternion = new THREE.Quaternion();
        if (length > 1e-6) {
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        }
        return { length, midpoint, quaternion };
    }, [start, end]);
    if (transform.length <= 1e-6)
        return null;
    return (_jsx("mesh", { castShadow: true, material: material, name: "skylight-surface", position: transform.midpoint, quaternion: transform.quaternion, receiveShadow: true, children: _jsx("cylinderGeometry", { args: [radius, radius, transform.length, 8] }) }));
}
function GlassPane({ glassThickness, material, name = 'skylight-glass', paneDepth, position = [0, 0, 0], rotation, width, }) {
    return (_jsx("mesh", { material: material, name: name, position: position, receiveShadow: true, rotation: rotation, children: _jsx("boxGeometry", { args: [paneSize(width), paneSize(glassThickness), paneSize(paneDepth)] }) }));
}
function PaneFrame({ depth, railHeight, railWidth, material, position = [0, 0, 0], width, }) {
    const halfW = width / 2;
    const halfD = depth / 2;
    const y = railHeight / 2;
    return (_jsxs("group", { position: position, children: [_jsx("mesh", { castShadow: true, material: material, name: "skylight-surface", position: [0, y, halfD], receiveShadow: true, children: _jsx("boxGeometry", { args: [paneSize(width + railWidth), railHeight, railWidth] }) }), _jsx("mesh", { castShadow: true, material: material, name: "skylight-surface", position: [0, y, -halfD], receiveShadow: true, children: _jsx("boxGeometry", { args: [paneSize(width + railWidth), railHeight, railWidth] }) }), _jsx("mesh", { castShadow: true, material: material, name: "skylight-surface", position: [-halfW, y, 0], receiveShadow: true, children: _jsx("boxGeometry", { args: [railWidth, railHeight, paneSize(depth + railWidth)] }) }), _jsx("mesh", { castShadow: true, material: material, name: "skylight-surface", position: [halfW, y, 0], receiveShadow: true, children: _jsx("boxGeometry", { args: [railWidth, railHeight, paneSize(depth + railWidth)] }) })] }));
}
function LanternGlass({ curbHeight, frameMaterial, glassMaterial, node, }) {
    const preset = SKYLIGHT_TYPE_PRESETS.lantern;
    const width = node.width - 0.01;
    const depth = node.height - 0.01;
    const height = Math.max(0.05, node.lanternHeight ?? preset.lanternHeight);
    const topScale = clamp01(node.lanternTopScale ?? preset.lanternTopScale);
    const baseHalfW = paneSize(width) / 2;
    const baseHalfD = paneSize(depth) / 2;
    const topHalfW = baseHalfW * topScale;
    const topHalfD = baseHalfD * topScale;
    const frameRadius = Math.max(0.008, node.frameThickness * 0.16);
    const baseCorners = [
        [-baseHalfW, 0, baseHalfD],
        [baseHalfW, 0, baseHalfD],
        [baseHalfW, 0, -baseHalfD],
        [-baseHalfW, 0, -baseHalfD],
    ];
    const topCorners = topScale <= 1e-4
        ? [
            [0, height, 0],
            [0, height, 0],
            [0, height, 0],
            [0, height, 0],
        ]
        : [
            [-topHalfW, height, topHalfD],
            [topHalfW, height, topHalfD],
            [topHalfW, height, -topHalfD],
            [-topHalfW, height, -topHalfD],
        ];
    const geometry = useMemo(() => buildLanternGlassGeometry(width, depth, height, topScale), [depth, height, topScale, width]);
    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);
    return (_jsxs("group", { position: [0, curbHeight, 0], children: [_jsx("mesh", { geometry: geometry, material: glassMaterial, name: "skylight-glass", receiveShadow: true }), baseCorners.map((corner, index) => (_jsx(FrameBar, { end: baseCorners[(index + 1) % baseCorners.length] ?? corner, material: frameMaterial, radius: frameRadius, start: corner }, `lantern-base-${index}`))), baseCorners.map((corner, index) => (_jsx(FrameBar, { end: topCorners[index] ?? corner, material: frameMaterial, radius: frameRadius, start: corner }, `lantern-hip-${index}`))), topScale > 1e-4 &&
                topCorners.map((corner, index) => (_jsx(FrameBar, { end: topCorners[(index + 1) % topCorners.length] ?? corner, material: frameMaterial, radius: frameRadius, start: corner }, `lantern-top-${index}`)))] }));
}
function getHingedPaneTransform(side, width, depth, openingAngle) {
    if (side === 'bottom') {
        return {
            hingePosition: [0, 0, -depth / 2],
            panePosition: [0, 0, depth / 2],
            rotation: [-openingAngle, 0, 0],
        };
    }
    if (side === 'left') {
        return {
            hingePosition: [-width / 2, 0, 0],
            panePosition: [width / 2, 0, 0],
            rotation: [0, 0, openingAngle],
        };
    }
    if (side === 'right') {
        return {
            hingePosition: [width / 2, 0, 0],
            panePosition: [-width / 2, 0, 0],
            rotation: [0, 0, -openingAngle],
        };
    }
    return {
        hingePosition: [0, 0, depth / 2],
        panePosition: [0, 0, -depth / 2],
        rotation: [openingAngle, 0, 0],
    };
}
function ElectricMotorHousing({ curbHeight, frameMaterial, glassThickness, node, side, }) {
    const size = Math.max(0.03, node.motorHousingSize ?? SKYLIGHT_TYPE_PRESETS.opening.motorHousingSize);
    const y = curbHeight + glassThickness + size / 2;
    const isHorizontalHinge = side === 'top' || side === 'bottom';
    return (_jsx("mesh", { castShadow: true, material: frameMaterial, name: "skylight-surface", position: [
            side === 'left' ? -node.width / 2 : side === 'right' ? node.width / 2 : 0,
            y,
            side === 'top' ? node.height / 2 : side === 'bottom' ? -node.height / 2 : 0,
        ], receiveShadow: true, children: _jsx("boxGeometry", { args: isHorizontalHinge
                ? [paneSize(node.width), size, size]
                : [size, size, paneSize(node.height)] }) }));
}
function HingedGlass({ curbHeight, frameMaterial, glassMaterial, glassThickness, hasMotorHousing, node, openAmount, }) {
    const preset = SKYLIGHT_TYPE_PRESETS.opening;
    const side = node.openingSide ?? preset.openingSide;
    const openingAngle = Math.max(0, node.openingAngle ?? preset.openingAngle) * clamp01(openAmount);
    const width = node.width - 0.01;
    const depth = node.height - 0.01;
    const transform = getHingedPaneTransform(side, width, depth, openingAngle);
    const frameRadius = Math.max(0.006, node.frameThickness * 0.13);
    const sashRailWidth = Math.max(0.018, node.frameThickness * 0.42);
    const sashRailHeight = Math.max(glassThickness * 1.4, node.frameThickness * 0.2);
    const showSupport = side === 'top' && openingAngle > 0.04;
    const supportX = width / 2 + node.frameThickness * 0.35;
    const supportStartZ = -depth / 2 + Math.min(0.12, depth * 0.12);
    const supportTravel = depth * 0.78;
    const supportEndY = curbHeight + glassThickness + Math.sin(openingAngle) * supportTravel;
    const supportEndZ = depth / 2 - Math.cos(openingAngle) * supportTravel;
    return (_jsxs(_Fragment, { children: [_jsxs("group", { position: [
                    transform.hingePosition[0],
                    curbHeight + glassThickness / 2,
                    transform.hingePosition[2],
                ], rotation: transform.rotation, children: [_jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: depth, position: transform.panePosition, width: width }), _jsx(PaneFrame, { depth: depth, material: frameMaterial, position: transform.panePosition, railHeight: sashRailHeight, railWidth: sashRailWidth, width: width })] }), showSupport && (_jsxs(_Fragment, { children: [_jsx(FrameBar, { end: [-supportX, supportEndY, supportEndZ], material: frameMaterial, radius: frameRadius * 0.72, start: [-supportX, curbHeight + 0.018, supportStartZ] }), _jsx(FrameBar, { end: [supportX, supportEndY, supportEndZ], material: frameMaterial, radius: frameRadius * 0.72, start: [supportX, curbHeight + 0.018, supportStartZ] })] })), hasMotorHousing && (_jsx(ElectricMotorHousing, { curbHeight: curbHeight, frameMaterial: frameMaterial, glassThickness: glassThickness, node: node, side: side }))] }));
}
function SlidingGlass({ curbHeight, frameMaterial, glassMaterial, glassThickness, node, openAmount, }) {
    const preset = SKYLIGHT_TYPE_PRESETS.sliding;
    const slideDirection = node.slideDirection ?? preset.slideDirection;
    const slideFraction = clamp01(openAmount);
    const trackWidth = Math.max(0.02, node.trackWidth ?? preset.trackWidth);
    const y = curbHeight + glassThickness / 2;
    const railY = curbHeight + glassThickness + trackWidth / 2;
    const sashRailWidth = Math.max(0.016, node.frameThickness * 0.36);
    const sashRailHeight = Math.max(glassThickness * 1.25, node.frameThickness * 0.18);
    if (slideDirection === 'x') {
        const paneWidth = (node.width - trackWidth) / 2;
        const fixedX = -node.width / 4;
        const movingX = node.width / 4 - slideFraction * paneWidth;
        const fixedPanePosition = [fixedX, y, 0];
        const movingPanePosition = [movingX, y + glassThickness + 0.003, 0];
        return (_jsxs(_Fragment, { children: [_jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: node.height - 0.01, position: fixedPanePosition, width: paneWidth }), _jsx(PaneFrame, { depth: node.height - 0.01, material: frameMaterial, position: fixedPanePosition, railHeight: sashRailHeight, railWidth: sashRailWidth, width: paneWidth }), _jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: node.height - 0.01, position: movingPanePosition, width: paneWidth }), _jsx(PaneFrame, { depth: node.height - 0.01, material: frameMaterial, position: movingPanePosition, railHeight: sashRailHeight, railWidth: sashRailWidth, width: paneWidth }), _jsx("mesh", { material: frameMaterial, name: "skylight-surface", position: [0, railY, node.height / 2], receiveShadow: true, children: _jsx("boxGeometry", { args: [paneSize(node.width + trackWidth * 2), trackWidth, trackWidth] }) }), _jsx("mesh", { material: frameMaterial, name: "skylight-surface", position: [0, railY, -node.height / 2], receiveShadow: true, children: _jsx("boxGeometry", { args: [paneSize(node.width + trackWidth * 2), trackWidth, trackWidth] }) })] }));
    }
    const paneDepth = (node.height - trackWidth) / 2;
    const fixedZ = -node.height / 4;
    const movingZ = node.height / 4 - slideFraction * paneDepth;
    const fixedPanePosition = [0, y, fixedZ];
    const movingPanePosition = [0, y + glassThickness + 0.003, movingZ];
    return (_jsxs(_Fragment, { children: [_jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: paneDepth, position: fixedPanePosition, width: node.width - 0.01 }), _jsx(PaneFrame, { depth: paneDepth, material: frameMaterial, position: fixedPanePosition, railHeight: sashRailHeight, railWidth: sashRailWidth, width: node.width - 0.01 }), _jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: paneDepth, position: movingPanePosition, width: node.width - 0.01 }), _jsx(PaneFrame, { depth: paneDepth, material: frameMaterial, position: movingPanePosition, railHeight: sashRailHeight, railWidth: sashRailWidth, width: node.width - 0.01 }), _jsx("mesh", { material: frameMaterial, name: "skylight-surface", position: [node.width / 2, railY, 0], receiveShadow: true, children: _jsx("boxGeometry", { args: [trackWidth, trackWidth, paneSize(node.height + trackWidth * 2)] }) }), _jsx("mesh", { material: frameMaterial, name: "skylight-surface", position: [-node.width / 2, railY, 0], receiveShadow: true, children: _jsx("boxGeometry", { args: [trackWidth, trackWidth, paneSize(node.height + trackWidth * 2)] }) })] }));
}
const SkylightRenderer = ({ node: storeNode }) => {
    const ref = useRef(null);
    useRegistry(storeNode.id, 'skylight', ref);
    const handlers = useNodeEvents(storeNode, 'skylight');
    const shading = useViewer((s) => s.shading);
    const textures = useViewer((s) => s.textures);
    const colorPreset = useViewer((s) => s.colorPreset);
    const sceneTheme = useViewer((s) => s.sceneTheme);
    const liveOverrides = useLiveNodeOverrides((state) => state.get(storeNode.id));
    const node = useMemo(() => (liveOverrides ? { ...storeNode, ...liveOverrides } : storeNode), [storeNode, liveOverrides]);
    const segment = useScene((state) => node.roofSegmentId
        ? state.nodes[node.roofSegmentId]
        : undefined);
    const frameGeo = useMemo(() => {
        return buildFrameGeometry({
            curb: node.curb,
            curbHeight: node.curbHeight,
            frameDepth: node.frameDepth,
            frameThickness: node.frameThickness,
            height: node.height,
            width: node.width,
        });
    }, [node.width, node.height, node.frameThickness, node.frameDepth, node.curb, node.curbHeight]);
    useEffect(() => {
        return () => {
            frameGeo?.dispose();
        };
    }, [frameGeo]);
    const frameMaterial = useMemo(() => {
        // Untextured frame (and everything in textures-off mode) takes the
        // themed 'joinery' role colour; explicit paint shows when textures on.
        if (!textures || (!node.material && !node.materialPreset)) {
            return createSurfaceRoleMaterial('joinery', colorPreset, undefined, sceneTheme);
        }
        if (node.material)
            return createMaterial(node.material, shading);
        return createMaterialFromPresetRef(node.materialPreset, shading) ?? defaultFrameMaterial;
    }, [textures, colorPreset, sceneTheme, shading, node.material, node.materialPreset]);
    const activeType = node.skylightType ?? 'flat';
    const typePreset = SKYLIGHT_TYPE_PRESETS[activeType];
    const glassThickness = Math.max(0.002, node.glassThickness ?? typePreset.glassThickness);
    const runtimeOpenAmount = useInteractive((state) => state.skylights[storeNode.id]?.operationState);
    const openAmount = runtimeOpenAmount ?? node.operationState ?? typePreset.operationState;
    const glassMaterial = useMemo(() => {
        // Untextured glass (and textures-off mode) takes the themed 'glazing'
        // role material — already DoubleSide + semi-transparent, and shared
        // from the cache, so it must not be mutated.
        if (!textures || (!node.glassMaterial && !node.glassMaterialPreset)) {
            return createSurfaceRoleMaterial('glazing', colorPreset, undefined, sceneTheme);
        }
        const mat = node.glassMaterial
            ? createMaterial(node.glassMaterial, shading)
            : (createMaterialFromPresetRef(node.glassMaterialPreset, shading) ??
                defaultGlassMaterial.clone());
        if (mat && typeof mat === 'object') {
            ;
            mat.side = THREE.DoubleSide;
            if (mat instanceof THREE.MeshPhysicalMaterial) {
                mat.thickness = glassThickness;
            }
        }
        return mat;
    }, [
        textures,
        colorPreset,
        sceneTheme,
        shading,
        glassThickness,
        node.glassMaterial,
        node.glassMaterialPreset,
    ]);
    const surfaceFrame = useMemo(() => {
        if (!segment)
            return { point: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0) };
        return getRoofOuterSurfaceFrameAtPoint(segment, node.position[0] ?? 0, node.position[2] ?? 0);
    }, [segment, node.position[0], node.position[2], node.rotation, liveOverrides, storeNode.id]);
    const surfaceQuat = useMemo(() => surfaceQuatFromNormal(surfaceFrame.normal, new THREE.Quaternion()), [surfaceFrame.normal]);
    // Compose the surface tilt with the skylight's own yaw so the
    // registered ref group below carries the complete "skylight pose in
    // segment frame" as a single local position+quaternion. Registry
    // handles (`portal: 'grandparent'`) read this Object3D's *local*
    // pose, so splitting the tilt and the yaw across nested groups would
    // leave the registered group with just the yaw and put the handles
    // at the wrong spot.
    const composedQuat = useMemo(() => {
        const q = new THREE.Quaternion().copy(surfaceQuat);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(yAxis, node.rotation ?? 0));
        return q;
    }, [surfaceQuat, node.rotation]);
    const hasCurb = node.curb ?? false;
    const curbH = hasCurb ? Math.max(0, node.curbHeight ?? 0.1) : 0;
    if (!segment || !frameGeo)
        return null;
    const surfaceY = surfaceFrame.point.y;
    return (_jsx("group", { position: segment.position, "rotation-y": segment.rotation, visible: node.visible, ...handlers, children: _jsxs("group", { position: [node.position[0] ?? 0, surfaceY, node.position[2] ?? 0], quaternion: composedQuat, ref: ref, children: [_jsx("mesh", { castShadow: true, geometry: frameGeo, material: frameMaterial, name: "skylight-surface", receiveShadow: true }), activeType === 'lantern' && (_jsx(LanternGlass, { curbHeight: curbH, frameMaterial: frameMaterial, glassMaterial: glassMaterial, node: node })), activeType === 'sliding' && (_jsx(SlidingGlass, { curbHeight: curbH, frameMaterial: frameMaterial, glassMaterial: glassMaterial, glassThickness: glassThickness, node: node, openAmount: openAmount })), activeType === 'opening' && (_jsx(HingedGlass, { curbHeight: curbH, frameMaterial: frameMaterial, glassMaterial: glassMaterial, glassThickness: glassThickness, hasMotorHousing: node.motorHousing ?? false, node: node, openAmount: openAmount })), (activeType === 'flat' || activeType === 'walk-on') && (_jsx(GlassPane, { glassThickness: glassThickness, material: glassMaterial, paneDepth: node.height + 0.004, position: [0, curbH + glassThickness / 2, 0], width: node.width + 0.004 }))] }) }));
};
export default SkylightRenderer;
