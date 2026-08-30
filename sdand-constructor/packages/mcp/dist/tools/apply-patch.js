import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { PatchSchema } from './schemas';
export const applyPatchInput = {
    patches: z.array(PatchSchema),
};
export const applyPatchOutput = {
    appliedOps: z.number(),
    deletedIds: z.array(z.string()),
    createdIds: z.array(z.string()),
};
export function registerApplyPatch(server, bridge) {
    server.registerTool('apply_patch', {
        title: 'Apply patch',
        description: 'Apply a batch of create/update/delete operations atomically. All patches are validated before any are applied; the entire batch forms a single undo step.',
        inputSchema: applyPatchInput,
        outputSchema: applyPatchOutput,
    }, async ({ patches }) => {
        const bridgePatches = patches.map((p) => {
            if (p.op === 'create') {
                return {
                    op: 'create',
                    node: p.node,
                    ...(p.parentId !== undefined ? { parentId: p.parentId } : {}),
                };
            }
            if (p.op === 'update') {
                return {
                    op: 'update',
                    id: p.id,
                    data: p.data,
                };
            }
            return {
                op: 'delete',
                id: p.id,
                ...(p.cascade !== undefined ? { cascade: p.cascade } : {}),
            };
        });
        try {
            const result = bridge.applyPatch(bridgePatches);
            await publishLiveSceneSnapshot(bridge, 'apply_patch');
            const payload = {
                appliedOps: result.appliedOps,
                deletedIds: result.deletedIds,
                createdIds: result.createdIds,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throwMcpError(ErrorCode.InvalidParams, msg);
        }
    });
}
