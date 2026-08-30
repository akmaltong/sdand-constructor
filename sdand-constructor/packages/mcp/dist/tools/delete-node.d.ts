import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const deleteNodeInput: {
    id: z.ZodString;
    cascade: z.ZodOptional<z.ZodBoolean>;
};
export declare const deleteNodeOutput: {
    deletedIds: z.ZodArray<z.ZodString>;
};
export declare function registerDeleteNode(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=delete-node.d.ts.map