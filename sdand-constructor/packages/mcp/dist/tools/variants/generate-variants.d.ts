import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const generateVariantsInput: {
    baseSceneId: z.ZodOptional<z.ZodString>;
    count: z.ZodDefault<z.ZodNumber>;
    vary: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        "wall-thickness": "wall-thickness";
        "wall-height": "wall-height";
        "zone-labels": "zone-labels";
        "room-proportions": "room-proportions";
        "open-plan": "open-plan";
        "door-positions": "door-positions";
        "fence-style": "fence-style";
    }>>>;
    seed: z.ZodOptional<z.ZodNumber>;
    save: z.ZodDefault<z.ZodBoolean>;
};
export declare const generateVariantsOutput: {
    variants: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        description: z.ZodString;
        nodeCount: z.ZodNumber;
        sceneId: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        graph: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>>;
};
export declare function registerGenerateVariants(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=generate-variants.d.ts.map