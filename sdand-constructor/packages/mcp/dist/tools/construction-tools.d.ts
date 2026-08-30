import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../operations';
export declare const createStoryShellInput: {
    levelId: z.ZodString;
    footprint: z.ZodArray<z.ZodArray<z.ZodNumber>>;
    wallHeight: z.ZodDefault<z.ZodNumber>;
    wallThickness: z.ZodDefault<z.ZodNumber>;
    createSlab: z.ZodDefault<z.ZodBoolean>;
    createCeiling: z.ZodDefault<z.ZodBoolean>;
    slabElevation: z.ZodDefault<z.ZodNumber>;
    ceilingHeight: z.ZodOptional<z.ZodNumber>;
    namePrefix: z.ZodOptional<z.ZodString>;
    wallMaterialPreset: z.ZodOptional<z.ZodString>;
    slabMaterialPreset: z.ZodOptional<z.ZodString>;
    ceilingMaterialPreset: z.ZodOptional<z.ZodString>;
};
export declare const createStoryShellOutput: {
    levelId: z.ZodString;
    wallIds: z.ZodArray<z.ZodString>;
    slabId: z.ZodNullable<z.ZodString>;
    ceilingId: z.ZodNullable<z.ZodString>;
    createdIds: z.ZodArray<z.ZodString>;
};
export declare const createRoofInput: {
    levelId: z.ZodString;
    roofLevelId: z.ZodOptional<z.ZodString>;
    useDedicatedRoofLevel: z.ZodDefault<z.ZodBoolean>;
    roofLevelLabel: z.ZodDefault<z.ZodString>;
    roofLevelElevation: z.ZodOptional<z.ZodNumber>;
    roofLevelHeight: z.ZodOptional<z.ZodNumber>;
    center: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    width: z.ZodNumber;
    depth: z.ZodNumber;
    roofType: z.ZodDefault<z.ZodEnum<{
        hip: "hip";
        gable: "gable";
        shed: "shed";
        gambrel: "gambrel";
        dutch: "dutch";
        mansard: "mansard";
        flat: "flat";
    }>>;
    pitch: z.ZodDefault<z.ZodNumber>;
    wallHeight: z.ZodDefault<z.ZodNumber>;
    wallThickness: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    materialPreset: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
};
export declare const createRoofOutput: {
    referenceLevelId: z.ZodString;
    roofLevelId: z.ZodString;
    createdRoofLevelId: z.ZodNullable<z.ZodString>;
    roofId: z.ZodString;
    roofSegmentId: z.ZodString;
};
export declare const createStairBetweenLevelsInput: {
    fromLevelId: z.ZodString;
    toLevelId: z.ZodString;
    position: z.ZodArray<z.ZodNumber>;
    rotation: z.ZodDefault<z.ZodNumber>;
    width: z.ZodDefault<z.ZodNumber>;
    runLength: z.ZodDefault<z.ZodNumber>;
    totalRise: z.ZodDefault<z.ZodNumber>;
    stepCount: z.ZodDefault<z.ZodNumber>;
    railingMode: z.ZodDefault<z.ZodEnum<{
        none: "none";
        left: "left";
        right: "right";
        both: "both";
    }>>;
    destinationSlabId: z.ZodOptional<z.ZodString>;
    sourceCeilingId: z.ZodOptional<z.ZodString>;
    createDestinationSlabOpening: z.ZodDefault<z.ZodBoolean>;
    createSourceCeilingOpening: z.ZodDefault<z.ZodBoolean>;
    openingWidth: z.ZodOptional<z.ZodNumber>;
    openingLength: z.ZodOptional<z.ZodNumber>;
    openingOffset: z.ZodDefault<z.ZodNumber>;
    openingCenter: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    openingRotation: z.ZodOptional<z.ZodNumber>;
    materialPreset: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
};
export declare const createStairBetweenLevelsOutput: {
    stairId: z.ZodString;
    stairSegmentId: z.ZodString;
    destinationSlabId: z.ZodNullable<z.ZodString>;
    sourceCeilingId: z.ZodNullable<z.ZodString>;
    openingPolygon: z.ZodArray<z.ZodArray<z.ZodNumber>>;
};
export declare function registerConstructionTools(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=construction-tools.d.ts.map