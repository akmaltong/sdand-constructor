'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { nodeRegistry, StairOpeningSystem, sceneRegistry, useScene, } from '@pascal-app/core';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { hasDrawableGeometry } from '../../lib/drawable-geometry';
import { PERF_OVERLAY_ENABLED, pushGpuSample } from '../../lib/gpu-perf';
import { applyIsolation, clearIsolation } from '../../lib/isolation';
import { getSceneTheme } from '../../lib/scene-themes';
import useViewer, {} from '../../store/use-viewer';
import { FloorElevationSystem } from '../../systems/floor-elevation/floor-elevation-system';
import { GeometrySystem } from '../../systems/geometry/geometry-system';
import { ErrorBoundary } from '../error-boundary';
import { SceneRenderer } from '../renderers/scene-renderer';
import FrameLimiter from './frame-limiter';
import { Lights } from './lights';
import { PerfMonitor } from './perf-monitor';
import PostProcessing, { DEFAULT_HOVER_STYLES } from './post-processing';
import { RegisteredSystems } from './registered-systems';
import { SceneBvh } from './scene-bvh';
import { SelectionManager } from './selection-manager';
import { ViewerCamera } from './viewer-camera';
extend(THREE);
// R3F's <Canvas> useLayoutEffect has no deps, so any re-render (theme switch,
// parent re-render, StrictMode double-mount) re-invokes `configure()`. With a
// sync `gl` factory that's harmless — the renderer is created once and reused.
// With an async factory (WebGPURenderer needs `await init()`), two configure
// calls can race: both see `state.gl == null` and both create a renderer. The
// first to resolve gets `setSize`/`setDpr` called on it; the second overwrites
// `state.gl` but R3F's store already holds the new size/dpr, so the new
// renderer is never resized and stays at the canvas's 300×150 default.
//
// Caching by canvas guarantees both branches return the same instance, so
// "duplicate" configure calls become no-ops on an already-sized renderer.
// We cache the in-flight Promise (not just the resolved renderer) so two
// concurrent configure() calls await the same init instead of creating two
// renderers in parallel and only caching the second.
const WEBGPU_RENDERER_CACHE = new WeakMap();
const SCENE_READY_SETTLED_FRAMES = 2;
const SCENE_READY_MAX_WAIT_FRAMES = 180;
const DIRTY_BUILD_KINDS = new Set([
    'ceiling',
    'door',
    'item',
    'roof',
    'roof-segment',
    'stair',
    'stair-segment',
    'wall',
    'window',
]);
const warnedEmptyDraw = process.env.NODE_ENV === 'production' ? null : new WeakSet();
/**
 * Renderer-level safety net against the empty-vertex-buffer crash.
 *
 * Wraps the per-object render function so any draw whose geometry has a count-0
 * `position` attribute is skipped instead of submitted. One such draw leaves
 * WebGPU vertex buffer slot 0 unbound, which the validator rejects and which
 * poisons the *whole* command encoder — so a single stray empty mesh (e.g. a
 * transient placeholder, or a derived edge/outline geometry) flickers the entire
 * canvas, not just itself. See `hasDrawableGeometry`.
 *
 * The custom render-object function is the documented three.js hook for this
 * (`Renderer.setRenderObjectFunction`); it must call `renderObject()` for
 * everything it keeps. `MergedOutlineNode` captures and restores this function
 * around its passes, so the guard survives outline rendering (its own passes
 * carry the same check inline).
 */
function installEmptyDrawGuard(renderer) {
    renderer.setRenderObjectFunction((object, scene, camera, geometry, material, group, lightsNode, clippingContext, passId) => {
        if (!hasDrawableGeometry(geometry)) {
            if (warnedEmptyDraw && !warnedEmptyDraw.has(geometry ?? object)) {
                warnedEmptyDraw.add(geometry ?? object);
                console.warn('[viewer] skipped a draw with an empty position buffer (would poison the WebGPU command encoder)', { name: object?.name, type: object?.type, material: material?.name });
            }
            return;
        }
        ;
        renderer.renderObject(object, scene, camera, geometry, material, group, lightsNode, clippingContext, passId);
    });
}
function GPUDeviceWatcher() {
    const gl = useThree((s) => s.gl);
    useEffect(() => {
        const backend = gl.backend;
        const device = backend?.device;
        if (!device) {
            console.warn('[viewer] No WebGPU device on backend — running on a fallback renderer.', {
                backend: backend?.constructor?.name ?? 'unknown',
                rendererType: gl.constructor?.name ?? 'unknown',
            });
            return;
        }
        console.log('[viewer] WebGPU device ready', {
            label: device.label,
            features: Array.from(device.features ?? []),
        });
        device.lost.then((info) => {
            console.error(`[viewer] WebGPU device lost: reason="${info.reason ?? 'unknown'}", message="${info.message ?? ''}". ` +
                'The page must be reloaded to recover the GPU context.');
        });
        // Uncaptured errors are normally silent (only console-warned by Chrome at
        // best). Pipe them to console.error so silent mobile crashes show up.
        const onUncapturedError = (event) => {
            console.error('[viewer] WebGPU uncaptured error:', event?.error?.message, event?.error);
        };
        device.addEventListener?.('uncapturederror', onUncapturedError);
        return () => {
            device.removeEventListener?.('uncapturederror', onUncapturedError);
        };
    }, [gl]);
    return null;
}
function ToneMappingExposure() {
    const sceneTheme = useViewer((state) => state.sceneTheme);
    const gl = useThree((state) => state.gl);
    const invalidate = useThree((state) => state.invalidate);
    useEffect(() => {
        gl.toneMappingExposure = getSceneTheme(sceneTheme).toneMappingExposure;
        invalidate();
    }, [gl, invalidate, sceneTheme]);
    return null;
}
function hasPendingSceneBuildWork() {
    const { dirtyNodes, nodes } = useScene.getState();
    for (const id of dirtyNodes) {
        const node = nodes[id];
        if (!node)
            continue;
        const def = nodeRegistry.get(node.type);
        if (def?.geometry || def?.capabilities?.floorPlaced || DIRTY_BUILD_KINDS.has(node.type)) {
            return true;
        }
    }
    return false;
}
function hasCommittedSceneRoot() {
    const { nodes, rootNodeIds } = useScene.getState();
    if (rootNodeIds.length === 0)
        return Object.keys(nodes).length === 0;
    return rootNodeIds.some((id) => sceneRegistry.nodes.has(id));
}
function SceneReadyTracker({ onSceneReadyChange, sceneReadyKey, }) {
    const readyRef = useRef(false);
    const settledFramesRef = useRef(0);
    const waitedFramesRef = useRef(0);
    const onSceneReadyChangeRef = useRef(onSceneReadyChange);
    useEffect(() => {
        onSceneReadyChangeRef.current = onSceneReadyChange;
    }, [onSceneReadyChange]);
    useEffect(() => {
        void sceneReadyKey;
        readyRef.current = false;
        settledFramesRef.current = 0;
        waitedFramesRef.current = 0;
        onSceneReadyChangeRef.current?.(false);
    }, [sceneReadyKey]);
    useFrame(() => {
        if (!(onSceneReadyChangeRef.current && !readyRef.current))
            return;
        waitedFramesRef.current += 1;
        if (waitedFramesRef.current < SCENE_READY_MAX_WAIT_FRAMES &&
            (!hasCommittedSceneRoot() || hasPendingSceneBuildWork())) {
            settledFramesRef.current = 0;
            return;
        }
        settledFramesRef.current += 1;
        if (settledFramesRef.current < SCENE_READY_SETTLED_FRAMES)
            return;
        readyRef.current = true;
        onSceneReadyChangeRef.current(true);
    }, 10);
    return null;
}
const Viewer = forwardRef(function Viewer({ children, hoverStyles = DEFAULT_HOVER_STYLES, selectionManager = 'default', perf = false, useBvh = true, renderContext = 'editor', defaultRender, isolate, sceneReadyKey, onSceneReadyChange, }, ref) {
    useImperativeHandle(ref, () => ({
        setIsolated: (ids) => applyIsolation(ids),
    }), []);
    // Track the most recently-applied isolation so the cleanup path can
    // restore visibility even if the prop is removed while the component is
    // still mounted. `clearIsolation()` is a no-op when nothing was applied.
    const isolateRef = useRef(undefined);
    useEffect(() => {
        isolateRef.current = isolate ?? null;
        applyIsolation(isolate ?? null);
        return () => {
            // Only clear if this effect was the one that applied — protects
            // against a parent unmount racing with a setIsolated() consumer.
            if (isolateRef.current === isolate)
                clearIsolation();
        };
    }, [isolate]);
    const isDark = useViewer((state) => getSceneTheme(state.sceneTheme).appearance === 'dark');
    const defaultShading = defaultRender?.shading;
    const defaultTextures = defaultRender?.textures;
    const defaultColorPreset = defaultRender?.colorPreset;
    const hasDefaultRender = defaultRender != null;
    useEffect(() => {
        const ctx = renderContext;
        useViewer.getState().setRenderContext(ctx);
        const { shading, shadingByContext, setShading } = useViewer.getState();
        setShading(shadingByContext[ctx] ?? defaultShading ?? shading);
        if (!hasDefaultRender || typeof window === 'undefined')
            return;
        let persistedState = {};
        const rawPreferences = window.localStorage.getItem('viewer-preferences');
        if (rawPreferences) {
            try {
                const parsed = JSON.parse(rawPreferences);
                if (parsed &&
                    typeof parsed === 'object' &&
                    parsed.state &&
                    typeof parsed.state === 'object') {
                    persistedState = parsed.state;
                }
            }
            catch { }
        }
        if (defaultTextures !== undefined && !('textures' in persistedState)) {
            useViewer.getState().setTextures(defaultTextures);
        }
        if (defaultColorPreset && !('colorPreset' in persistedState)) {
            useViewer.getState().setColorPreset(defaultColorPreset);
        }
    }, [defaultColorPreset, defaultShading, defaultTextures, hasDefaultRender, renderContext]);
    // Coarse-pointer devices (phones/tablets) get a tighter DPR ceiling to keep
    // fragment-shader cost down — saves another ~30% over 1.5x on high-DPI mobile.
    // Desktops (fine pointer) keep the original 1.5 cap.
    const maxDpr = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5;
    return (_jsxs(Canvas, { camera: { position: [50, 50, 50], fov: 50 }, className: `transition-colors duration-700 ${isDark ? 'bg-[#1f2433]' : 'bg-[#fafafa]'}`, dpr: [1, maxDpr], frameloop: "never", gl: ((props) => {
            const canvas = props.canvas;
            const cached = canvas ? WEBGPU_RENDERER_CACHE.get(canvas) : undefined;
            if (cached)
                return cached;
            const promise = (async () => {
                try {
                    const renderer = new THREE.WebGPURenderer(props);
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    renderer.toneMappingExposure = getSceneTheme(useViewer.getState().sceneTheme).toneMappingExposure;
                    await renderer.init();
                    installEmptyDrawGuard(renderer);
                    return renderer;
                }
                catch (err) {
                    // Drop the failed promise from the cache so a future Canvas
                    // mount on the same DOM can retry instead of inheriting the
                    // rejection forever.
                    if (canvas)
                        WEBGPU_RENDERER_CACHE.delete(canvas);
                    console.error('[viewer] WebGPURenderer init failed', err);
                    throw err;
                }
            })();
            if (canvas)
                WEBGPU_RENDERER_CACHE.set(canvas, promise);
            return promise;
        }), resize: {
            debounce: 100,
        }, shadows: {
            type: THREE.PCFShadowMap,
            enabled: true,
        }, children: [_jsx(FrameLimiter, { fps: 50 }), _jsx(ViewerCamera, {}), _jsx(GPUDeviceWatcher, {}), _jsx(ToneMappingExposure, {}), _jsx(SceneReadyTracker, { onSceneReadyChange: onSceneReadyChange, sceneReadyKey: sceneReadyKey }), _jsxs(ErrorBoundary, { fallback: null, scope: "viewer-scene", children: [_jsx(Lights, {}), useBvh ? (_jsx(SceneBvh, { children: _jsx(SceneRenderer, {}) })) : (_jsx(SceneRenderer, {})), _jsx(FloorElevationSystem, {}), _jsx(GeometrySystem, {}), _jsx(StairOpeningSystem, {}), _jsx(RegisteredSystems, {}), _jsx(PostProcessing, { hoverStyles: hoverStyles }), selectionManager === 'default' && _jsx(SelectionManager, {}), (perf || PERF_OVERLAY_ENABLED) && _jsx(PerfMonitor, {}), children] })] }));
});
const DebugRenderer = () => {
    useFrame(({ gl, scene, camera }) => {
        const submittedAt = PERF_OVERLAY_ENABLED ? performance.now() : 0;
        gl.render(scene, camera);
        if (PERF_OVERLAY_ENABLED) {
            const queue = gl.backend?.device?.queue;
            queue?.onSubmittedWorkDone?.().then(() => {
                pushGpuSample(performance.now() - submittedAt);
            });
        }
    });
    return null;
};
export default Viewer;
