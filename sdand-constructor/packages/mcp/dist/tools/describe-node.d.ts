import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const describeNodeInput: {
    id: z.ZodString;
};
export declare const describeNodeOutput: {
    id: z.ZodString;
    type: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    ancestryIds: z.ZodArray<z.ZodString>;
    childrenIds: z.ZodArray<z.ZodString>;
    properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    description: z.ZodString;
};
export declare function registerDescribeNode(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=describe-node.d.ts.map