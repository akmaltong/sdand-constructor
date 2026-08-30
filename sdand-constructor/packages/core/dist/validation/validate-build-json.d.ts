import { type AnyNodeType } from '../schema/types';
export type ValidationSeverity = 'error' | 'warning';
export type ValidationIssue = {
    severity: ValidationSeverity;
    code: string;
    message: string;
    nodeId?: string;
};
export type BuildStats = {
    total: number;
    byType: Partial<Record<AnyNodeType, number>>;
    unknownTypes: Record<string, number>;
    floorAreaM2: number;
};
export type ParsedBuildJson = {
    nodes: Record<string, unknown>;
    rootNodeIds: string[];
};
export type SchemaIssue = {
    nodeId: string;
    nodeType: string;
    path: string;
    message: string;
};
export type ValidateBuildJsonResult = {
    ok: boolean;
    parsed: ParsedBuildJson | null;
    stats: BuildStats;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    schemaIssues: SchemaIssue[];
    schemaIssueCount: number;
};
/**
 * Pre-flight validator for `{ nodes, rootNodeIds }` build JSON loaded via
 * Load Build (drag-drop, IFC converter output, hand-edited files).
 *
 * Reports issues without mutating; the scene store still owns migration
 * and orphan cleanup at import time. Hard errors mean the file is
 * structurally unusable and import should be blocked.
 */
export declare function validateBuildJson(input: unknown): ValidateBuildJsonResult;
//# sourceMappingURL=validate-build-json.d.ts.map