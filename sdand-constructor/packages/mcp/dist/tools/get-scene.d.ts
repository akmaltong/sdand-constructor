import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const getSceneInput: {};
export declare const getSceneOutput: {
    nodes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    rootNodeIds: z.ZodArray<z.ZodString>;
    collections: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare function registerGetScene(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=get-scene.d.ts.map