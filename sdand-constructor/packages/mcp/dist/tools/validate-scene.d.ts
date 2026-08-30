import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const validateSceneInput: {};
export declare const validateSceneOutput: {
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodObject<{
        nodeId: z.ZodString;
        path: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>>;
};
export declare function registerValidateScene(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=validate-scene.d.ts.map