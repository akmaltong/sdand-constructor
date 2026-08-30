import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
export declare const createFromTemplateInput: {
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    /**
     * When persistence operations are wired into the MCP server, set this flag to
     * `true` to immediately save the instantiated template and return its
     * `SceneMeta`. When `false` (default) the template is applied to the bridge
     * only.
     */
    save: z.ZodDefault<z.ZodBoolean>;
    projectId: z.ZodOptional<z.ZodString>;
};
export declare const createFromTemplateOutput: {
    templateId: z.ZodString;
    rootNodeIds: z.ZodArray<z.ZodString>;
    nodeCount: z.ZodNumber;
    /** Present when `save: true` (and a store was available). */
    scene: z.ZodOptional<z.ZodObject<{
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
    }, z.core.$strip>>;
};
/**
 * `create_from_template` — instantiate a seed template into the bridge, and
 * optionally persist it via the attached scene operations.
 *
 * The source template is cloned with fresh ids (`cloneSceneGraph`) so the
 * deterministic placeholders (`site_empty`, `wall_n`, …) don't collide
 * across repeated calls or with other scenes.
 */
export declare function registerCreateFromTemplate(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=create-from-template.d.ts.map