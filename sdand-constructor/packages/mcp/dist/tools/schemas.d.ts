import { z } from 'zod';
/**
 * Shared Zod schemas used by multiple MCP tools. Keep DRY — if a shape is
 * referenced by more than one tool, define it here.
 */
/** A node identifier — non-empty string. The core uses `${prefix}_${nanoid}`. */
export declare const NodeIdSchema: z.ZodString;
/**
 * 2D point as [x, z] (floor plane). Use array length constraints instead of
 * `z.tuple()` so MCP hosts that only accept JSON Schema's common `items` shape
 * can register the tools.
 */
export declare const Vec2Schema: z.ZodArray<z.ZodNumber>;
/** 3D point as [x, y, z]. */
export declare const Vec3Schema: z.ZodArray<z.ZodNumber>;
/**
 * A single patch operation. Union of create / update / delete.
 *
 * For `create`, the node object must include `type` so Zod can discriminate at
 * the bridge layer — we accept a plain object here and let the bridge's Zod
 * re-parse catch structural issues. For `update`, `data` is a partial merge.
 */
export declare const CreatePatchSchema: z.ZodObject<{
    op: z.ZodLiteral<"create">;
    node: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    parentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePatchSchema: z.ZodObject<{
    op: z.ZodLiteral<"update">;
    id: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export declare const DeletePatchSchema: z.ZodObject<{
    op: z.ZodLiteral<"delete">;
    id: z.ZodString;
    cascade: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const PatchSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
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
}, z.core.$strip>], "op">;
export type Patch = z.infer<typeof PatchSchema>;
//# sourceMappingURL=schemas.d.ts.map