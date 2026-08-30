import { pauseSceneHistory, resumeSceneHistory } from '../store/history-control';
import { collectSubtree, cloneNodesInto as runCloneNodesInto, } from './subtree';
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
export function createSceneApi(store) {
    let snapshot = null;
    function captureIfNeeded(id) {
        if (!snapshot || snapshot.has(id))
            return;
        const existing = store.getState().nodes[id];
        snapshot.set(id, existing ?? null);
    }
    return {
        get(id) {
            return store.getState().nodes[id];
        },
        nodes() {
            return store.getState().nodes;
        },
        update(id, patch) {
            captureIfNeeded(id);
            store.getState().updateNode(id, patch);
        },
        upsert(node, parentId) {
            captureIfNeeded(node.id);
            store.getState().createNode(node, parentId);
            return node.id;
        },
        delete(id) {
            captureIfNeeded(id);
            store.getState().deleteNode(id);
        },
        restore(id) {
            if (!snapshot)
                return;
            const original = snapshot.get(id);
            if (original === undefined)
                return;
            const current = store.getState().nodes[id];
            if (original === null) {
                if (current)
                    store.getState().deleteNode(id);
            }
            else if (!current) {
                store.getState().createNode(original);
            }
            else {
                store.getState().updateNode(id, original);
            }
        },
        restoreAll() {
            if (!snapshot)
                return;
            for (const id of snapshot.keys()) {
                this.restore(id);
            }
        },
        markDirty(id) {
            store.getState().markDirty(id);
        },
        pauseHistory() {
            pauseSceneHistory(store);
            if (!snapshot)
                snapshot = new Map();
        },
        resumeHistory() {
            resumeSceneHistory(store);
            snapshot = null;
        },
        getSubtree(rootId) {
            return collectSubtree(store.getState().nodes, rootId);
        },
        cloneNodesInto(nodes, opts) {
            const { rootId, nodes: cloned } = runCloneNodesInto(nodes, opts);
            const root = cloned[0];
            if (!root)
                return null;
            const state = store.getState();
            const ops = [];
            for (let i = 0; i < cloned.length; i += 1) {
                const node = cloned[i];
                if (i === 0) {
                    ops.push(opts.parentId ? { node, parentId: opts.parentId } : { node });
                }
                else {
                    ops.push({ node });
                }
            }
            const batch = state.createNodes;
            if (batch) {
                batch(ops);
            }
            else {
                for (const op of ops)
                    state.createNode(op.node, op.parentId);
            }
            return rootId;
        },
    };
}
