import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const loadSceneInput: {
    id: z.ZodString;
};
export declare const loadSceneOutput: {
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
    url: z.ZodString;
    editorUrl: z.ZodString;
    published: z.ZodBoolean;
    isDraft: z.ZodBoolean;
    saveMode: z.ZodEnum<{
        draft: "draft";
        checkpoint: "checkpoint";
    }>;
    graphHash: z.ZodOptional<z.ZodString>;
    levelIds: z.ZodArray<z.ZodString>;
    defaultLevelId: z.ZodNullable<z.ZodString>;
};
export declare function registerLoadScene(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=load-scene.d.ts.map