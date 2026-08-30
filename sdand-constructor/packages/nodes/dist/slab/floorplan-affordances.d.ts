/**
 * 2D drag affordances for slab. Three operations, each accepting an
 * optional `holeIndex` in the payload so they target the boundary
 * polygon or a specific hole:
 *
 *   - `move-vertex` — drag an existing vertex.
 *   - `add-vertex` — insert a new vertex at a midpoint then drag.
 *   - `move-edge` — drag a whole edge perpendicular to itself.
 *
 * Holes are surfaced inline alongside the boundary in `def.floorplan`
 * (no separate "hole edit mode" state machine like the legacy) — when
 * the slab is selected, every hole's handles appear at the same time.
 * Simpler model, no UX downside in practice.
 */
export declare const slabMoveVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `slab_${string}`;
    type: "slab";
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    elevation: number;
    autoFromWalls: boolean;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
    material?: {
        id?: string | undefined;
        preset?: "custom" | "white" | "brick" | "concrete" | "wood" | "glass" | "metal" | "plaster" | "tile" | "marble" | undefined;
        properties?: {
            color: string;
            roughness: number;
            metalness: number;
            opacity: number;
            transparent: boolean;
            side: "front" | "back" | "double";
        } | undefined;
        texture?: {
            url: string;
            repeat?: [number, number] | undefined;
            scale?: number | undefined;
        } | undefined;
    } | undefined;
    materialPreset?: string | undefined;
}>;
export declare const slabAddVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `slab_${string}`;
    type: "slab";
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    elevation: number;
    autoFromWalls: boolean;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
    material?: {
        id?: string | undefined;
        preset?: "custom" | "white" | "brick" | "concrete" | "wood" | "glass" | "metal" | "plaster" | "tile" | "marble" | undefined;
        properties?: {
            color: string;
            roughness: number;
            metalness: number;
            opacity: number;
            transparent: boolean;
            side: "front" | "back" | "double";
        } | undefined;
        texture?: {
            url: string;
            repeat?: [number, number] | undefined;
            scale?: number | undefined;
        } | undefined;
    } | undefined;
    materialPreset?: string | undefined;
}>;
export declare const slabMoveEdgeAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `slab_${string}`;
    type: "slab";
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    elevation: number;
    autoFromWalls: boolean;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
    material?: {
        id?: string | undefined;
        preset?: "custom" | "white" | "brick" | "concrete" | "wood" | "glass" | "metal" | "plaster" | "tile" | "marble" | undefined;
        properties?: {
            color: string;
            roughness: number;
            metalness: number;
            opacity: number;
            transparent: boolean;
            side: "front" | "back" | "double";
        } | undefined;
        texture?: {
            url: string;
            repeat?: [number, number] | undefined;
            scale?: number | undefined;
        } | undefined;
    } | undefined;
    materialPreset?: string | undefined;
}>;
//# sourceMappingURL=floorplan-affordances.d.ts.map