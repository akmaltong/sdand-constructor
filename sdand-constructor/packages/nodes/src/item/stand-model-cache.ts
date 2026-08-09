import type { Group } from 'three'

/**
 * Cache of imported stand models (GLB → THREE.Group), keyed by `asset.src`.
 * `apps/editor` fills it during the worker-based import so placed items mount
 * instantly instead of re-parsing the GLB on the main thread.
 */
const standModels = new Map<string, Group>()

export const getStandModel = (src: string | undefined | null): Group | undefined =>
  src ? standModels.get(src) : undefined

export const setStandModel = (src: string, group: Group): void => {
  standModels.set(src, group)
}

export const hasStandModel = (src: string | undefined | null): src is string =>
  !!src && standModels.has(src)
