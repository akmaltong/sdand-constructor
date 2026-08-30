'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
const useViewer = create()(persist((set) => ({
    selection: { buildingId: null, levelId: null, zoneId: null, selectedIds: [] },
    previewSelectedIds: [],
    setPreviewSelectedIds: (ids) => set({ previewSelectedIds: ids }),
    hoverHighlightMode: 'default',
    setHoverHighlightMode: (mode) => set((state) => (state.hoverHighlightMode === mode ? state : { hoverHighlightMode: mode })),
    hoveredId: null,
    setHoveredId: (id) => set((state) => (state.hoveredId === id ? state : { hoveredId: id })),
    cameraMode: 'perspective',
    setCameraMode: (mode) => set({ cameraMode: mode }),
    sceneTheme: 'studio',
    setSceneTheme: (id) => set({ sceneTheme: id }),
    renderContext: 'editor',
    setRenderContext: (context) => set({ renderContext: context }),
    shading: 'rendered',
    shadingByContext: {},
    setShading: (shading) => set((state) => ({
        shading,
        shadingByContext: { ...state.shadingByContext, [state.renderContext]: shading },
    })),
    textures: true,
    setTextures: (textures) => set({ textures }),
    colorPreset: 'clay',
    setColorPreset: (preset) => set({ colorPreset: preset }),
    edges: 'soft',
    setEdges: (edges) => set({ edges }),
    shadows: true,
    setShadows: (shadows) => set({ shadows }),
    unit: 'metric',
    setUnit: (unit) => set({ unit }),
    levelMode: 'stacked',
    setLevelMode: (mode) => set({ levelMode: mode }),
    wallMode: 'up',
    setWallMode: (mode) => set({ wallMode: mode }),
    showScans: true,
    setShowScans: (show) => set((state) => {
        const projectPreferences = { ...(state.projectPreferences || {}) };
        if (state.projectId) {
            projectPreferences[state.projectId] = {
                ...(projectPreferences[state.projectId] || {}),
                showScans: show,
            };
        }
        return { showScans: show, projectPreferences };
    }),
    showGuides: true,
    setShowGuides: (show) => set((state) => {
        const projectPreferences = { ...(state.projectPreferences || {}) };
        if (state.projectId) {
            projectPreferences[state.projectId] = {
                ...(projectPreferences[state.projectId] || {}),
                showGuides: show,
            };
        }
        return { showGuides: show, projectPreferences };
    }),
    showGrid: true,
    setShowGrid: (show) => set((state) => {
        const projectPreferences = { ...(state.projectPreferences || {}) };
        if (state.projectId) {
            projectPreferences[state.projectId] = {
                ...(projectPreferences[state.projectId] || {}),
                showGrid: show,
            };
        }
        return { showGrid: show, projectPreferences };
    }),
    projectId: null,
    setProjectId: (id) => set((state) => {
        if (!id)
            return { projectId: id };
        const prefs = state.projectPreferences?.[id] || {};
        return {
            projectId: id,
            showScans: prefs.showScans ?? true,
            showGuides: prefs.showGuides ?? true,
            showGrid: prefs.showGrid ?? true,
        };
    }),
    projectPreferences: {},
    setSelection: (updates) => set((state) => {
        const newSelection = { ...state.selection, ...updates };
        // Hierarchy Guard: If we change a high-level parent, reset the children unless explicitly provided
        if (updates.buildingId !== undefined) {
            if (updates.levelId === undefined)
                newSelection.levelId = null;
            if (updates.zoneId === undefined)
                newSelection.zoneId = null;
            if (updates.selectedIds === undefined)
                newSelection.selectedIds = [];
        }
        if (updates.levelId !== undefined) {
            if (updates.zoneId === undefined)
                newSelection.zoneId = null;
            if (updates.selectedIds === undefined)
                newSelection.selectedIds = [];
        }
        if (updates.zoneId !== undefined) {
            if (updates.selectedIds === undefined)
                newSelection.selectedIds = [];
        }
        return { selection: newSelection, previewSelectedIds: [] };
    }),
    resetSelection: () => set({
        selection: {
            buildingId: null,
            levelId: null,
            zoneId: null,
            selectedIds: [],
        },
        previewSelectedIds: [],
    }),
    outliner: { selectedObjects: [], hoveredObjects: [] },
    exportScene: null,
    setExportScene: (fn) => set({ exportScene: fn }),
    debugColors: false,
    setDebugColors: (enabled) => set({ debugColors: enabled }),
    walkthroughMode: false,
    setWalkthroughMode: (mode) => set({ walkthroughMode: mode }),
    cameraDragging: false,
    setCameraDragging: (dragging) => set({ cameraDragging: dragging }),
    inputDragging: false,
    setInputDragging: (dragging) => set({ inputDragging: dragging }),
}), {
    name: 'viewer-preferences',
    partialize: (state) => ({
        cameraMode: state.cameraMode,
        sceneTheme: state.sceneTheme,
        shadingByContext: state.shadingByContext,
        textures: state.textures,
        colorPreset: state.colorPreset,
        edges: state.edges,
        shadows: state.shadows,
        unit: state.unit,
        levelMode: state.levelMode,
        wallMode: state.wallMode,
        projectPreferences: state.projectPreferences,
    }),
}));
export default useViewer;
