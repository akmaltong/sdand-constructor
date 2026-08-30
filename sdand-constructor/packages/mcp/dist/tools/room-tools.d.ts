import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const searchAssetsInput: {
    query: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
};
export declare const searchAssetsOutput: {
    results: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    total: z.ZodNumber;
};
export declare const createRoomInput: {
    levelId: z.ZodString;
    name: z.ZodString;
    polygon: z.ZodArray<z.ZodArray<z.ZodNumber>>;
    color: z.ZodOptional<z.ZodString>;
    wallHeight: z.ZodOptional<z.ZodNumber>;
    wallThickness: z.ZodOptional<z.ZodNumber>;
};
export declare const createRoomOutput: {
    zoneId: z.ZodString;
    slabId: z.ZodString;
    ceilingId: z.ZodString;
    wallIds: z.ZodArray<z.ZodString>;
    areaSqMeters: z.ZodNumber;
};
export declare const addDoorInput: {
    wallId: z.ZodString;
    t: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    hingesSide: z.ZodOptional<z.ZodEnum<{
        left: "left";
        right: "right";
    }>>;
    swingDirection: z.ZodOptional<z.ZodEnum<{
        inward: "inward";
        outward: "outward";
    }>>;
};
export declare const addDoorOutput: {
    doorId: z.ZodString;
    localX: z.ZodNumber;
    t: z.ZodNumber;
    position: z.ZodNumber;
    wallLength: z.ZodNumber;
    clamped: z.ZodBoolean;
    coordinateSystem: z.ZodLiteral<"wall-local-meters">;
};
export declare const addWindowInput: {
    wallId: z.ZodString;
    t: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    sillHeight: z.ZodOptional<z.ZodNumber>;
};
export declare const addWindowOutput: {
    windowId: z.ZodString;
    localX: z.ZodNumber;
    t: z.ZodNumber;
    position: z.ZodNumber;
    wallLength: z.ZodNumber;
    clamped: z.ZodBoolean;
    coordinateSystem: z.ZodLiteral<"wall-local-meters">;
    sillHeight: z.ZodNumber;
};
export declare const furnishRoomInput: {
    levelId: z.ZodOptional<z.ZodString>;
    zoneId: z.ZodOptional<z.ZodString>;
    roomType: z.ZodEnum<{
        bedroom: "bedroom";
        storage: "storage";
        living: "living";
        dining: "dining";
        kitchen: "kitchen";
        bathroom: "bathroom";
        laundry: "laundry";
        entry: "entry";
        hallway: "hallway";
    }>;
    polygon: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodNumber>>>;
    doorWallIndex: z.ZodOptional<z.ZodNumber>;
};
export declare const furnishRoomOutput: {
    placed: z.ZodNumber;
    itemIds: z.ZodArray<z.ZodString>;
    skipped: z.ZodArray<z.ZodString>;
};
export declare function registerSearchAssets(server: McpServer): void;
export declare function registerCreateRoom(server: McpServer, bridge: SceneOperations): void;
export declare function registerAddDoor(server: McpServer, bridge: SceneOperations): void;
export declare function registerAddWindow(server: McpServer, bridge: SceneOperations): void;
export declare function registerFurnishRoom(server: McpServer, bridge: SceneOperations): void;
export declare function registerRoomTools(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=room-tools.d.ts.map