/**
 * 2D drag affordances for ceiling. Same three operations as slab
 * (`move-vertex`, `add-vertex`, `move-edge`), each accepting an
 * optional `holeIndex`. See `slab/floorplan-affordances.ts` for the
 * full contract.
 */
export declare const ceilingMoveVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `ceiling_${string}`;
    type: "ceiling";
    children: `item_${string}`[];
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    height: number;
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
export declare const ceilingAddVertexAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `ceiling_${string}`;
    type: "ceiling";
    children: `item_${string}`[];
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    height: number;
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
export declare const ceilingMoveEdgeAffordance: import("@pascal-app/core").FloorplanAffordance<{
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `ceiling_${string}`;
    type: "ceiling";
    children: `item_${string}`[];
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "elevator" | "stair" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    height: number;
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