import type * as THREE from 'three';
type ByTypeMap = {
    [kind: string]: Set<string>;
};
export declare const sceneRegistry: {
    nodes: Map<string, THREE.Object3D<THREE.Object3DEventMap>>;
    byType: ByTypeMap;
    /** Remove all entries. Call when unloading a scene to prevent stale 3D refs. */
    clear(): void;
};
export declare function useRegistry(id: string, type: string, ref: React.RefObject<THREE.Object3D>): void;
export {};
//# sourceMappingURL=scene-registry.d.ts.map