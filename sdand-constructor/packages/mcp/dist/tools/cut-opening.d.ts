import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const cutOpeningInput: {
    wallId: z.ZodString;
    type: z.ZodEnum<{
        window: "window";
        door: "door";
    }>;
    position: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
};
export declare const cutOpeningOutput: {
    openingId: z.ZodString;
};
export declare function registerCutOpening(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=cut-opening.d.ts.map