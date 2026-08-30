import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const exportJsonInput: {
    pretty: z.ZodOptional<z.ZodBoolean>;
};
export declare const exportJsonOutput: {
    json: z.ZodString;
};
export declare function registerExportJson(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=export-json.d.ts.map