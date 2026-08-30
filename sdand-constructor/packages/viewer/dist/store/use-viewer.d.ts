import type { AnyNode, BaseNode, BuildingNode, LevelNode, ZoneNode } from '@pascal-app/core';
import type { Object3D } from 'three';
import type { EdgeMode } from '../lib/edge-style';
import type { ColorPreset, RenderShading } from '../lib/materials';
export type RenderContext = 'editor' | 'viewer';
type SelectionPath = {
    buildingId: BuildingNode['id'] | null;
    levelId: LevelNode['id'] | null;
    zoneId: ZoneNode['id'] | null;
    selectedIds: BaseNode['id'][];
};
type Outliner = {
    selectedObjects: Object3D[];
    hoveredObjects: Object3D[];
};
type ViewerState = {
    selection: SelectionPath;
    previewSelectedIds: BaseNode['id'][];
    setPreviewSelectedIds: (ids: BaseNode['id'][]) => void;
    hoverHighlightMode: string;
    setHoverHighlightMode: (mode: string) => void;
    hoveredId: AnyNode['id'] | ZoneNode['id'] | null;
    setHoveredId: (id: AnyNode['id'] | ZoneNode['id'] | null) => void;
    cameraMode: 'perspective' | 'orthographic';
    setCameraMode: (mode: 'perspective' | 'orthographic') => void;
    sceneTheme: string;
    setSceneTheme: (id: string) => void;
    renderContext: RenderContext;
    setRenderContext: (context: RenderContext) => void;
    shading: RenderShading;
    shadingByContext: Partial<Record<RenderContext, RenderShading>>;
    setShading: (shading: RenderShading) => void;
    textures: boolean;
    setTextures: (textures: boolean) => void;
    colorPreset: ColorPreset;
    setColorPreset: (preset: ColorPreset) => void;
    edges: EdgeMode;
    setEdges: (edges: EdgeMode) => void;
    shadows: boolean;
    setShadows: (shadows: boolean) => void;
    unit: 'metric' | 'imperial';
    setUnit: (unit: 'metric' | 'imperial') => void;
    levelMode: 'stacked' | 'exploded' | 'solo' | 'manual';
    setLevelMode: (mode: 'stacked' | 'exploded' | 'solo' | 'manual') => void;
    wallMode: 'up' | 'cutaway' | 'down';
    setWallMode: (mode: 'up' | 'cutaway' | 'down') => void;
    showScans: boolean;
    setShowScans: (show: boolean) => void;
    showGuides: boolean;
    setShowGuides: (show: boolean) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    projectId: string | null;
    setProjectId: (id: string | null) => void;
    projectPreferences: Record<string, {
        showScans?: boolean;
        showGuides?: boolean;
        showGrid?: boolean;
    }>;
    setSelection: (updates: Partial<SelectionPath>) => void;
    resetSelection: () => void;
    outliner: Outliner;
    exportScene: ((format?: 'glb' | 'stl' | 'obj') => Promise<void>) | null;
    setExportScene: (fn: ((format?: 'glb' | 'stl' | 'obj') => Promise<void>) | null) => void;
    debugColors: boolean;
    setDebugColors: (enabled: boolean) => void;
    walkthroughMode: boolean;
    setWalkthroughMode: (mode: boolean) => void;
    cameraDragging: boolean;
    setCameraDragging: (dragging: boolean) => void;
    /**
     * True while a host-driven drag is in progress (editor handles —
     * height arrow, width arrow, etc.). Suppresses node pointer event
     * routing so the synthetic click on pointerup doesn't reroute
     * selection to whatever mesh the cursor lands on at release.
     * Conceptually a sibling of `cameraDragging` — both mean "user is
     * dragging; don't treat the next pointerup as a click on the
     * scene." Set by the host (e.g. `NodeArrowHandles` in the editor);
     * the viewer only reads it.
     */
    inputDragging: boolean;
    setInputDragging: (dragging: boolean) => void;
};
declare const useViewer: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ViewerState>, "setState" | "persist"> & {
    setState(partial: ViewerState | Partial<ViewerState> | ((state: ViewerState) => ViewerState | Partial<ViewerState>), replace?: false | undefined): unknown;
    setState(state: ViewerState | ((state: ViewerState) => ViewerState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ViewerState, {
            cameraMode: "perspective" | "orthographic";
            sceneTheme: string;
            shadingByContext: Partial<Record<RenderContext, RenderShading>>;
            textures: boolean;
            colorPreset: ColorPreset;
            edges: EdgeMode;
            shadows: boolean;
            unit: "metric" | "imperial";
            levelMode: "manual" | "stacked" | "exploded" | "solo";
            wallMode: "up" | "down" | "cutaway";
            projectPreferences: Record<string, {
                showScans?: boolean;
                showGuides?: boolean;
                showGrid?: boolean;
            }>;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ViewerState) => void) => () => void;
        onFinishHydration: (fn: (state: ViewerState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ViewerState, {
            cameraMode: "perspective" | "orthographic";
            sceneTheme: string;
            shadingByContext: Partial<Record<RenderContext, RenderShading>>;
            textures: boolean;
            colorPreset: ColorPreset;
            edges: EdgeMode;
            shadows: boolean;
            unit: "metric" | "imperial";
            levelMode: "manual" | "stacked" | "exploded" | "solo";
            wallMode: "up" | "down" | "cutaway";
            projectPreferences: Record<string, {
                showScans?: boolean;
                showGuides?: boolean;
                showGrid?: boolean;
            }>;
        }, unknown>>;
    };
}>;
export default useViewer;
//# sourceMappingURL=use-viewer.d.ts.map