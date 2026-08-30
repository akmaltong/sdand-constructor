import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { NodeIdSchema } from './schemas';
export const getNodeInput = {
    id: NodeIdSchema,
};
export const getNodeOutput = {
    node: z.record(z.string(), z.unknown()),
};
export function registerGetNode(server, bridge) {
    server.registerTool('get_node', {
        title: 'Get node',
        description: 'Return the full node payload for the given ID.',
        inputSchema: getNodeInput,
        outputSchema: getNodeOutput,
    }, async ({ id }) => {
        const node = bridge.getNode(id);
        if (!node) {
            throwMcpError(ErrorCode.InvalidParams, `Node not found: ${id}`);
        }
        const payload = { node: node };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
