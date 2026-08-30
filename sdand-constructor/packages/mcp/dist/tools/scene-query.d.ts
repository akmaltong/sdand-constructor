import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const levelScopedInput: {
    levelId: z.ZodOptional<z.ZodString>;
};
export declare const listLevelsOutput: {
    activeSceneId: z.ZodNullable<z.ZodString>;
    levelCount: z.ZodNumber;
    occupiedStoryCount: z.ZodNumber;
    supportLevelCount: z.ZodNumber;
    roofLevelIds: z.ZodArray<z.ZodString>;
    levels: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const getLevelSummaryOutput: {
    levelId: z.ZodString;
    levelName: z.ZodOptional<z.ZodString>;
    role: z.ZodString;
    metadataRole: z.ZodNullable<z.ZodString>;
    isOccupiedStory: z.ZodBoolean;
    isSupportLevel: z.ZodBoolean;
    referenceLevelId: z.ZodNullable<z.ZodString>;
    counts: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    walls: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    zones: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    items: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    slabs: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ceilings: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const getWallsOutput: {
    levelId: z.ZodString;
    walls: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const getZonesOutput: {
    levelId: z.ZodString;
    zones: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
};
export declare const verifySceneOutput: {
    ok: z.ZodBoolean;
    valid: z.ZodBoolean;
    levelCount: z.ZodNumber;
    occupiedStoryCount: z.ZodNumber;
    supportLevelCount: z.ZodNumber;
    roofLevelIds: z.ZodArray<z.ZodString>;
    activeSceneId: z.ZodNullable<z.ZodString>;
    levels: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    emptyLevelIds: z.ZodArray<z.ZodString>;
    issues: z.ZodArray<z.ZodString>;
    hasIssues: z.ZodBoolean;
};
export declare function registerListLevels(server: McpServer, bridge: SceneOperations): void;
export declare function registerGetLevelSummary(server: McpServer, bridge: SceneOperations): void;
export declare function registerGetWalls(server: McpServer, bridge: SceneOperations): void;
export declare function registerGetZones(server: McpServer, bridge: SceneOperations): void;
export declare function registerVerifyScene(server: McpServer, bridge: SceneOperations): void;
export declare function registerSceneQueryTools(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=scene-query.d.ts.map