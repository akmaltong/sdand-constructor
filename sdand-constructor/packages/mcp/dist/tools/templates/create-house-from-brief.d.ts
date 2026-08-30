import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const createHouseFromBriefInput: {
    brief: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    projectName: z.ZodOptional<z.ZodString>;
    bedroomCount: z.ZodOptional<z.ZodNumber>;
    rooms: z.ZodOptional<z.ZodArray<z.ZodString>>;
    style: z.ZodOptional<z.ZodString>;
    landscaping: z.ZodOptional<z.ZodBoolean>;
    constraints: z.ZodOptional<z.ZodString>;
};
export declare const createHouseFromBriefOutput: {
    projectId: z.ZodNullable<z.ZodString>;
    editorUrl: z.ZodNullable<z.ZodString>;
    url: z.ZodNullable<z.ZodString>;
    version: z.ZodNullable<z.ZodNumber>;
    published: z.ZodBoolean;
    isDraft: z.ZodBoolean;
    templateId: z.ZodString;
    nodeCount: z.ZodNumber;
    roomCount: z.ZodNumber;
    levelIds: z.ZodArray<z.ZodString>;
    defaultLevelId: z.ZodNullable<z.ZodString>;
    validation: z.ZodObject<{
        valid: z.ZodBoolean;
        errors: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    summary: z.ZodString;
    limitations: z.ZodArray<z.ZodString>;
    nextStep: z.ZodString;
};
export declare function registerCreateHouseFromBrief(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=create-house-from-brief.d.ts.map