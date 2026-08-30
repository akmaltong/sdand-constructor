import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const setZoneInput: {
    levelId: z.ZodString;
    polygon: z.ZodArray<z.ZodArray<z.ZodNumber>>;
    label: z.ZodString;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const setZoneOutput: {
    zoneId: z.ZodString;
};
export declare function registerSetZone(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=set-zone.d.ts.map