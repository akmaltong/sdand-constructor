import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const placeItemInput: {
    catalogItemId: z.ZodString;
    targetNodeId: z.ZodString;
    position: z.ZodArray<z.ZodNumber>;
    rotation: z.ZodOptional<z.ZodNumber>;
};
export declare const placeItemOutput: {
    itemId: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
};
export declare function registerPlaceItem(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=place-item.d.ts.map