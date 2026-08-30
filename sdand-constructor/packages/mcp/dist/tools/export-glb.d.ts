import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const exportGlbInput: {};
export declare const exportGlbOutput: {
    status: z.ZodLiteral<"not_implemented">;
    reason: z.ZodString;
};
export declare function registerExportGlb(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=export-glb.d.ts.map