import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const renameSceneInput: {
    id: z.ZodString;
    newName: z.ZodString;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
};
export declare const renameSceneOutput: {
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
};
export declare function registerRenameScene(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=rename-scene.d.ts.map