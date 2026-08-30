import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const findNodesInput: {
    type: z.ZodOptional<z.ZodEnum<{
        site: "site";
        building: "building";
        level: "level";
        wall: "wall";
        fence: "fence";
        item: "item";
        zone: "zone";
        slab: "slab";
        stair: "stair";
        ceiling: "ceiling";
        roof: "roof";
        "roof-segment": "roof-segment";
        "stair-segment": "stair-segment";
        scan: "scan";
        guide: "guide";
        window: "window";
        door: "door";
    }>>;
    parentId: z.ZodOptional<z.ZodString>;
    levelId: z.ZodOptional<z.ZodString>;
    zoneId: z.ZodOptional<z.ZodString>;
};
export declare const findNodesOutput: {
    nodes: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare function registerFindNodes(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=find-nodes.d.ts.map