import type { AnyNode, AnyNodeId } from '../schema/types';
import type { SceneApi } from './types';
/**
 * Minimal store shape this module depends on.
 *
 * Decoupled from `useScene` directly so the production singleton and tests can
 * share one factory. The full store implements a superset.
 */
export type SceneStoreLike = {
    getState: () => {
        nodes: Record<AnyNodeId, AnyNode>;
        rootNodeIds: AnyNodeId[];
        dirtyNodes: Set<AnyNodeId>;
        createNode: (node: AnyNode, parentId?: AnyNodeId) => void;
        createNodes?: (ops: {
            node: AnyNode;
            parentId?: AnyNodeId;
        }[]) => void;
        updateNode: (id: AnyNodeId, data: Partial<AnyNode>) => void;
        deleteNode: (id: AnyNodeId) => void;
        markDirty: (id: AnyNodeId) => void;
    };
    temporal: {
        getState: () => {
            pause: () => void;
            resume: () => void;
        };
    };
};
/**
 * Creates a {@link SceneApi} backed by a store.
 *
 * Snapshot semantics:
 * - `pauseHistory()` starts a copy-on-write window. The first time `update`,
 *   `upsert`, or `delete` touches a node id, the pre-change value is captured.
 * - `restore(id)` and `restoreAll()` apply the captured value back. Either is
 *   safe to call only while a pause window is active.
 * - `resumeHistory()` drops the snapshot.
 *
 * Snapshots are lazy and bounded by the number of nodes touched during the
 * pause window — never an upfront clone of the entire scene.
 */
export declare function createSceneApi(store: SceneStoreLike): SceneApi;
//# sourceMappingURL=scene-api.d.ts.map