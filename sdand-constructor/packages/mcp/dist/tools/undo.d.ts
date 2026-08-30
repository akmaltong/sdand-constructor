import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const undoInput: {
    steps: z.ZodOptional<z.ZodNumber>;
};
export declare const undoOutput: {
    undone: z.ZodNumber;
};
export declare function registerUndo(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=undo.d.ts.map