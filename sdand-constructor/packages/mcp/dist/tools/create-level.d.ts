import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const createLevelInput: {
    buildingId: z.ZodString;
    elevation: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    label: z.ZodOptional<z.ZodString>;
};
export declare const createLevelOutput: {
    levelId: z.ZodString;
};
export declare function registerCreateLevel(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=create-level.d.ts.map