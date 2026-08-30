import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const saveSceneInput: {
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    saveMode: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        checkpoint: "checkpoint";
    }>>;
    publish: z.ZodOptional<z.ZodBoolean>;
    thumbnail: z.ZodOptional<z.ZodString>;
    includeCurrentScene: z.ZodDefault<z.ZodBoolean>;
    graph: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const saveSceneOutput: {
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
export declare function registerSaveScene(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=save-scene.d.ts.map