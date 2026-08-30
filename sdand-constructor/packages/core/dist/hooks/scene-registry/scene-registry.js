'use client';
import { useLayoutEffect } from 'react';
const byTypeStore = new Map();
const byTypeProxy = new Proxy({}, {
    get(_target, key) {
        if (typeof key !== 'string')
            return undefined;
        let set = byTypeStore.get(key);
        if (!set) {
            set = new Set();
            byTypeStore.set(key, set);
        }
        return set;
    },
    ownKeys() {
        return Array.from(byTypeStore.keys());
    },
    has(_target, key) {
        return typeof key === 'string' && byTypeStore.has(key);
    },
    getOwnPropertyDescriptor(_target, key) {
        if (typeof key !== 'string')
            return undefined;
        const set = byTypeStore.get(key);
        if (!set)
            return undefined;
        return { configurable: true, enumerable: true, value: set, writable: false };
    },
});
export const sceneRegistry = {
    // Master lookup: ID -> Object3D
    nodes: new Map(),
    // Categorized lookups: Kind -> Set of IDs. Backed by a Proxy so any kind
    // gets a Set on first touch — no hardcoded list.
    byType: byTypeProxy,
    /** Remove all entries. Call when unloading a scene to prevent stale 3D refs. */
    clear() {
        this.nodes.clear();
        for (const set of byTypeStore.values()) {
            set.clear();
        }
    },
};
export function useRegistry(id, type, ref) {
    useLayoutEffect(() => {
        const obj = ref.current;
        if (!obj)
            return;
        // 1. Add to master map
        sceneRegistry.nodes.set(id, obj);
        // 2. Add to type-specific set — Proxy auto-creates on first access.
        sceneRegistry.byType[type].add(id);
        // 3. Cleanup when component unmounts
        return () => {
            sceneRegistry.nodes.delete(id);
            sceneRegistry.byType[type].delete(id);
        };
    }, [id, type, ref]);
}
