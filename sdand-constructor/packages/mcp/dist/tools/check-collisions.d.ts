import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const checkCollisionsInput: {
    levelId: z.ZodOptional<z.ZodString>;
};
export declare const checkCollisionsOutput: {
    collisions: z.ZodArray<z.ZodObject<{
        aId: z.ZodString;
        bId: z.ZodString;
        kind: z.ZodString;
    }, z.core.$strip>>;
};
export declare function registerCheckCollisions(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=check-collisions.d.ts.map