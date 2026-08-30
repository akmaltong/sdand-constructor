import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema } from './schemas';
export const deleteNodeInput = {
    id: NodeIdSchema,
    cascade: z.boolean().optional(),
};
export const deleteNodeOutput = {
    deletedIds: z.array(z.string()),
};
export function registerDeleteNode(server, bridge) {
    server.registerTool('delete_node', {
        title: 'Delete node',
        description: 'Delete a node. If it has children, pass `cascade: true` to delete descendants recursively.',
        inputSchema: deleteNodeInput,
        outputSchema: deleteNodeOutput,
    }, async ({ id, cascade }) => {
        const node = bridge.getNode(id);
        if (!node) {
            throwMcpError(ErrorCode.InvalidParams, `Node not found: ${id}`);
        }
        try {
            const removed = bridge.deleteNode(id, cascade ?? false);
            await publishLiveSceneSnapshot(bridge, 'delete_node');
            const payload = { deletedIds: removed };
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throwMcpError(ErrorCode.InvalidRequest, msg);
        }
    });
}
