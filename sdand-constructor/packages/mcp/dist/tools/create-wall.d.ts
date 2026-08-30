import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const createWallInput: {
    levelId: z.ZodString;
    start: z.ZodArray<z.ZodNumber>;
    end: z.ZodArray<z.ZodNumber>;
    thickness: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
};
export declare const createWallOutput: {
    wallId: z.ZodString;
};
export declare function registerCreateWall(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=create-wall.d.ts.map