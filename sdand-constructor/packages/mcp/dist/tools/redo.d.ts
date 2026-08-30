import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const redoInput: {
    steps: z.ZodOptional<z.ZodNumber>;
};
export declare const redoOutput: {
    redone: z.ZodNumber;
};
export declare function registerRedo(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=redo.d.ts.map