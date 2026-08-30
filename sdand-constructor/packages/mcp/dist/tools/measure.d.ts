import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const measureInput: {
    fromId: z.ZodString;
    toId: z.ZodString;
};
export declare const measureOutput: {
    distanceMeters: z.ZodNumber;
    areaSqMeters: z.ZodOptional<z.ZodNumber>;
    units: z.ZodLiteral<"meters">;
};
export declare function registerMeasure(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=measure.d.ts.map