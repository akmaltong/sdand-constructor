import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const duplicateLevelInput: {
    levelId: z.ZodString;
};
export declare const duplicateLevelOutput: {
    newLevelId: z.ZodString;
    newNodeIds: z.ZodArray<z.ZodString>;
};
export declare function registerDuplicateLevel(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=duplicate-level.d.ts.map