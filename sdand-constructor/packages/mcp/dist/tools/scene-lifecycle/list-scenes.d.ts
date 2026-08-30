import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const listScenesInput: {
    projectId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const listScenesOutput: {
    scenes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        projectId: z.ZodNullable<z.ZodString>;
        thumbnailUrl: z.ZodNullable<z.ZodString>;
        version: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        ownerId: z.ZodNullable<z.ZodString>;
        sizeBytes: z.ZodNumber;
        nodeCount: z.ZodNumber;
        editorUrl: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        published: z.ZodOptional<z.ZodBoolean>;
        graphHash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
};
export declare function registerListScenes(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=list-scenes.d.ts.map