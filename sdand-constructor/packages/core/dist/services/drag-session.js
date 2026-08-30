import { cascadeDirty } from '../registry/relations-resolver';
const EMPTY_MODIFIERS = { shift: false, alt: false, ctrl: false, meta: false };
export function createDragSession(action, scene, options = {}) {
    let active = false;
    let ctx = null;
    let draft = null;
    let dirtyMarked = new Set();
    function markWithCascade(id) {
        if (dirtyMarked.has(id))
            return;
        const ids = cascadeDirty(id, {
            scene,
            spatialQuery: options.spatialQuery,
            childQuery: options.childQuery,
        });
        for (const dirtyId of ids) {
            if (!dirtyMarked.has(dirtyId)) {
                scene.markDirty(dirtyId);
                dirtyMarked.add(dirtyId);
            }
        }
    }
    function terminate(committed) {
        if (!active)
            return;
        active = false;
        ctx = null;
        draft = null;
        dirtyMarked = new Set();
        scene.resumeHistory();
        if (committed)
            options.onCommit?.();
        else
            options.onCancel?.();
    }
    return {
        start(input) {
            if (active)
                return; // ignore re-entry
            scene.pauseHistory();
            ctx = action.begin({
                node: input.node,
                point: input.point,
                handleId: input.handleId,
                modifiers: input.modifiers ?? EMPTY_MODIFIERS,
            });
            active = true;
        },
        move(point, modifiers) {
            if (!active || ctx == null)
                return;
            let next = action.preview(ctx, point, modifiers);
            if (action.snap) {
                next = action.snap(next, ctx, undefined);
            }
            draft = next;
            const dirtyIds = action.apply(next, ctx, scene);
            for (const id of dirtyIds)
                markWithCascade(id);
        },
        commit() {
            if (!active || ctx == null)
                return false;
            const ok = action.commit?.(draft, ctx, scene) ?? true;
            if (!ok) {
                action.cancel(ctx, scene);
                scene.restoreAll();
            }
            terminate(ok);
            return ok;
        },
        cancel() {
            if (!active || ctx == null)
                return;
            action.cancel(ctx, scene);
            scene.restoreAll();
            terminate(false);
        },
        getDraft() {
            return draft;
        },
        isActive() {
            return active;
        },
        dispose() {
            if (active && ctx != null) {
                action.cancel(ctx, scene);
                scene.restoreAll();
                // Silent terminate: no onCancel. The caller (e.g. useDragAction's
                // effect cleanup) is reacting to the parent unmounting and would
                // loop the state machine if onCancel re-set the parent's state.
                active = false;
                ctx = null;
                draft = null;
                dirtyMarked = new Set();
                scene.resumeHistory();
            }
        },
    };
}
