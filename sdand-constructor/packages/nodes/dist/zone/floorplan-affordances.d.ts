/**
 * 2D drag affordances for zone — same three polygon-editing operations
 * slabs and ceilings expose. Zones have no `holes` field, but the
 * shared factory accepts that case (holeIndex stays undefined and the
 * boundary polygon is the target).
 *
 *   - `move-vertex` — drag an existing polygon vertex.
 *   - `add-vertex` — insert a new vertex at an edge midpoint, then drag.
 *   - `move-edge` — drag an entire edge perpendicular to itself.
 */
export declare const zoneMoveVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    id: `zone_${string}`;
    type: "zone";
    name: string;
    polygon: [number, number][];
    color: string;
    metadata: import("zod").JSONType;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
}>;
export declare const zoneAddVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    id: `zone_${string}`;
    type: "zone";
    name: string;
    polygon: [number, number][];
    color: string;
    metadata: import("zod").JSONType;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
}>;
export declare const zoneMoveEdgeAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    id: `zone_${string}`;
    type: "zone";
    name: string;
    polygon: [number, number][];
    color: string;
    metadata: import("zod").JSONType;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
}>;
//# sourceMappingURL=floorplan-affordances.d.ts.map