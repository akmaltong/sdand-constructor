import { AnyNode } from '../schema/types';
const KNOWN_TYPES = new Set(AnyNode.options.map((o) => o.shape.type.parse(undefined)));
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function polygonAreaM2(points) {
    if (points.length < 3)
        return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if (!a || !b)
            return 0;
        area += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(area) / 2;
}
function isPointArray(value) {
    if (!Array.isArray(value))
        return false;
    return value.every((p) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number');
}
/**
 * Pre-flight validator for `{ nodes, rootNodeIds }` build JSON loaded via
 * Load Build (drag-drop, IFC converter output, hand-edited files).
 *
 * Reports issues without mutating; the scene store still owns migration
 * and orphan cleanup at import time. Hard errors mean the file is
 * structurally unusable and import should be blocked.
 */
export function validateBuildJson(input) {
    const errors = [];
    const warnings = [];
    const schemaIssues = [];
    const stats = { total: 0, byType: {}, unknownTypes: {}, floorAreaM2: 0 };
    if (!isPlainObject(input)) {
        errors.push({
            severity: 'error',
            code: 'not_an_object',
            message: 'File is not a JSON object.',
        });
        return {
            ok: false,
            parsed: null,
            stats,
            errors,
            warnings,
            schemaIssues,
            schemaIssueCount: 0,
        };
    }
    const nodesRaw = input.nodes;
    const rootNodeIdsRaw = input.rootNodeIds;
    if (!isPlainObject(nodesRaw)) {
        errors.push({
            severity: 'error',
            code: 'missing_nodes',
            message: 'Missing or invalid "nodes" — expected an object of id → node.',
        });
    }
    if (!Array.isArray(rootNodeIdsRaw) || !rootNodeIdsRaw.every((id) => typeof id === 'string')) {
        errors.push({
            severity: 'error',
            code: 'missing_root_node_ids',
            message: 'Missing or invalid "rootNodeIds" — expected an array of node IDs.',
        });
    }
    if (errors.length > 0) {
        return {
            ok: false,
            parsed: null,
            stats,
            errors,
            warnings,
            schemaIssues,
            schemaIssueCount: 0,
        };
    }
    const nodes = nodesRaw;
    const rootNodeIds = rootNodeIdsRaw;
    if (rootNodeIds.length === 0) {
        errors.push({
            severity: 'error',
            code: 'empty_root_node_ids',
            message: '"rootNodeIds" is empty — no entry point into the scene.',
        });
    }
    let validRootCount = 0;
    let mismatchedKeyCount = 0;
    let schemaFailureCount = 0;
    for (const [key, value] of Object.entries(nodes)) {
        if (!isPlainObject(value)) {
            warnings.push({
                severity: 'warning',
                code: 'node_not_object',
                message: `Node "${key}" is not an object.`,
                nodeId: key,
            });
            continue;
        }
        stats.total += 1;
        const id = typeof value.id === 'string' ? value.id : null;
        const type = typeof value.type === 'string' ? value.type : null;
        const parentId = typeof value.parentId === 'string' ? value.parentId : null;
        if (id && id !== key) {
            mismatchedKeyCount += 1;
        }
        if (!type) {
            warnings.push({
                severity: 'warning',
                code: 'missing_type',
                message: `Node "${key}" has no "type" field.`,
                nodeId: key,
            });
            continue;
        }
        if (KNOWN_TYPES.has(type)) {
            const t = type;
            stats.byType[t] = (stats.byType[t] ?? 0) + 1;
            const parseResult = AnyNode.safeParse(value);
            if (!parseResult.success) {
                schemaFailureCount += 1;
                const issue = parseResult.error.issues[0];
                schemaIssues.push({
                    nodeId: key,
                    nodeType: type,
                    path: issue ? issue.path.join('.') : '',
                    message: issue ? issue.message : 'schema mismatch',
                });
            }
            if (type === 'slab') {
                const polygon = value.polygon;
                if (isPointArray(polygon)) {
                    let area = polygonAreaM2(polygon);
                    const holes = value.holes;
                    if (Array.isArray(holes)) {
                        for (const hole of holes) {
                            if (isPointArray(hole))
                                area -= polygonAreaM2(hole);
                        }
                    }
                    stats.floorAreaM2 += Math.max(0, area);
                }
            }
        }
        else {
            stats.unknownTypes[type] = (stats.unknownTypes[type] ?? 0) + 1;
        }
        if (parentId && !(parentId in nodes)) {
            warnings.push({
                severity: 'warning',
                code: 'orphan_parent',
                message: `Node "${key}" has parentId "${parentId}" which is not in the file (will be dropped on import).`,
                nodeId: key,
            });
        }
    }
    if (mismatchedKeyCount > 0) {
        warnings.push({
            severity: 'warning',
            code: 'key_id_mismatch',
            message: `${mismatchedKeyCount} node${mismatchedKeyCount === 1 ? '' : 's'} have a key that does not match their "id" field.`,
        });
    }
    const unknownTypeNames = Object.keys(stats.unknownTypes);
    if (unknownTypeNames.length > 0) {
        const totalUnknown = unknownTypeNames.reduce((n, t) => n + stats.unknownTypes[t], 0);
        warnings.push({
            severity: 'warning',
            code: 'unknown_types',
            message: `${totalUnknown} node${totalUnknown === 1 ? '' : 's'} use unknown type${unknownTypeNames.length === 1 ? '' : 's'}: ${unknownTypeNames.join(', ')}.`,
        });
    }
    if (schemaFailureCount > 0) {
        errors.push({
            severity: 'error',
            code: 'schema_failure',
            message: `${schemaFailureCount} node${schemaFailureCount === 1 ? '' : 's'} did not match the expected schema. See details below — these would cause the editor to crash on load.`,
        });
    }
    for (const id of rootNodeIds) {
        if (id in nodes) {
            validRootCount += 1;
        }
        else {
            warnings.push({
                severity: 'warning',
                code: 'orphan_root',
                message: `Root node "${id}" is not in the file (will be ignored on import).`,
                nodeId: id,
            });
        }
    }
    if (rootNodeIds.length > 0 && validRootCount === 0) {
        errors.push({
            severity: 'error',
            code: 'no_valid_roots',
            message: 'None of the rootNodeIds point to a node in the file.',
        });
    }
    const hasBuildingOrSite = (stats.byType.building ?? 0) > 0 || (stats.byType.site ?? 0) > 0;
    if (!hasBuildingOrSite) {
        warnings.push({
            severity: 'warning',
            code: 'no_building',
            message: 'No site or building node found.',
        });
    }
    if ((stats.byType.level ?? 0) === 0) {
        warnings.push({
            severity: 'warning',
            code: 'no_levels',
            message: 'No level nodes found.',
        });
    }
    const ok = errors.length === 0;
    return {
        ok,
        parsed: ok ? { nodes, rootNodeIds } : null,
        stats,
        errors,
        warnings,
        schemaIssues,
        schemaIssueCount: schemaFailureCount,
    };
}
