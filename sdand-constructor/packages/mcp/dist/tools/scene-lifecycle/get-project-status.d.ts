import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const getProjectStatusInput: {
    id: z.ZodString;
};
export declare const getProjectStatusOutput: {
    id: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    editorUrl: z.ZodString;
    url: z.ZodString;
    ownerId: z.ZodNullable<z.ZodString>;
    thumbnailUrl: z.ZodNullable<z.ZodString>;
    publishedVersion: z.ZodNullable<z.ZodNumber>;
    latestVersion: z.ZodNullable<z.ZodNumber>;
    draftVersion: z.ZodNullable<z.ZodNumber>;
    browserVisibleVersion: z.ZodNullable<z.ZodNumber>;
    version: z.ZodNumber;
    isEmpty: z.ZodBoolean;
    sizeBytes: z.ZodNumber;
    nodeCount: z.ZodNumber;
    graphHash: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    levelIds: z.ZodArray<z.ZodString>;
    defaultLevelId: z.ZodNullable<z.ZodString>;
    nextStep: z.ZodString;
};
export declare function registerGetProjectStatus(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=get-project-status.d.ts.map