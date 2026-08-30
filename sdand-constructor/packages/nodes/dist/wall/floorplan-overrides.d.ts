import type { AnyNode, AnyNodeId } from '@pascal-app/core';
/**
 * Project per-frame wall drag overrides (`{ start, end, curveOffset }`)
 * from `useLiveNodeOverrides` into a fresh `nodes` snapshot. The 2D drag
 * handlers publish overrides for the moved wall plus its linked
 * neighbours; the floor-plan layer hands the merged snapshot to
 * `buildContext` so each wall's `ctx.siblings` (which feeds the
 * miter calculation) reflects the live cursor positions instead of
 * the last committed scene state.
 *
 * Only wall entries are touched; every other node is shared by
 * reference. The allocation cost is one shallow object per overridden
 * wall — the override map is small, so this is cheap. When the
 * override map is empty (no live drag) the input is returned
 * unchanged.
 */
export declare function wallFloorplanSiblingOverrides(args: {
    nodeId: AnyNodeId;
    nodes: Record<AnyNodeId, AnyNode>;
    liveOverrides: Map<string, Record<string, unknown>>;
}): Record<AnyNodeId, AnyNode>;
//# sourceMappingURL=floorplan-overrides.d.ts.map