import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const applyPatchInput: {
    patches: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"create">;
        node: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        parentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"update">;
        id: z.ZodString;
        data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"delete">;
        id: z.ZodString;
        cascade: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>], "op">>;
};
export declare const applyPatchOutput: {
    appliedOps: z.ZodNumber;
    deletedIds: z.ZodArray<z.ZodString>;
    createdIds: z.ZodArray<z.ZodString>;
};
export declare function registerApplyPatch(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=apply-patch.d.ts.map