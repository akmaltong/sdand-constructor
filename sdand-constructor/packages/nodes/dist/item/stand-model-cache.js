/**
 * Cache of imported stand models (GLB → THREE.Group), keyed by `asset.src`.
 * `apps/editor` fills it during the worker-based import so placed items mount
 * instantly instead of re-parsing the GLB on the main thread.
 */
const standModels = new Map();
export const getStandModel = (src) => src ? standModels.get(src) : undefined;
export const setStandModel = (src, group) => {
    standModels.set(src, group);
};
export const hasStandModel = (src) => !!src && standModels.has(src);
