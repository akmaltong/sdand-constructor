import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const getNodeInput: {
    id: z.ZodString;
};
export declare const getNodeOutput: {
    node: z.ZodRecord<z.ZodString, z.ZodUnknown>;
};
export declare function registerGetNode(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=get-node.d.ts.map