import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const deleteSceneInput: {
    id: z.ZodString;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
};
export declare const deleteSceneOutput: {
    deleted: z.ZodBoolean;
};
export declare function registerDeleteScene(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=delete-scene.d.ts.map