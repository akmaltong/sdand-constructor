import { z } from 'zod';
import type { MaterialSchema as MaterialSchemaType } from '../material';
export declare const StairRailingMode: z.ZodEnum<{
    none: "none";
    left: "left";
    right: "right";
    both: "both";
}>;
export declare const StairType: z.ZodEnum<{
    straight: "straight";
    spiral: "spiral";
    curved: "curved";
}>;
export declare const StairTopLandingMode: z.ZodEnum<{
    none: "none";
    integrated: "integrated";
}>;
export declare const StairSlabOpeningMode: z.ZodEnum<{
    none: "none";
    destination: "destination";
}>;
export type StairRailingMode = z.infer<typeof StairRailingMode>;
export type StairType = z.infer<typeof StairType>;
export type StairTopLandingMode = z.infer<typeof StairTopLandingMode>;
export type StairSlabOpeningMode = z.infer<typeof StairSlabOpeningMode>;
export type StairSurfaceMaterialRole = 'railing' | 'tread' | 'side';
export type StairSurfaceMaterialSpec = {
    material?: MaterialSchemaType;
    materialPreset?: string;
};
export declare const StairNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`stair_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"stair">>;
    material: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        preset: z.ZodOptional<z.ZodEnum<{
            custom: "custom";
            white: "white";
            brick: "brick";
            concrete: "concrete";
            wood: "wood";
            glass: "glass";
            metal: "metal";
            plaster: "plaster";
            tile: "tile";
            marble: "marble";
        }>>;
        properties: z.ZodOptional<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            roughness: z.ZodDefault<z.ZodNumber>;
            metalness: z.ZodDefault<z.ZodNumber>;
            opacity: z.ZodDefault<z.ZodNumber>;
            transparent: z.ZodDefault<z.ZodBoolean>;
            side: z.ZodDefault<z.ZodEnum<{
                front: "front";
                back: "back";
                double: "double";
            }>>;
        }, z.core.$strip>>;
        texture: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            repeat: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            scale: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    materialPreset: z.ZodOptional<z.ZodString>;
    railingMaterial: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        preset: z.ZodOptional<z.ZodEnum<{
            custom: "custom";
            white: "white";
            brick: "brick";
            concrete: "concrete";
            wood: "wood";
            glass: "glass";
            metal: "metal";
            plaster: "plaster";
            tile: "tile";
            marble: "marble";
        }>>;
        properties: z.ZodOptional<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            roughness: z.ZodDefault<z.ZodNumber>;
            metalness: z.ZodDefault<z.ZodNumber>;
            opacity: z.ZodDefault<z.ZodNumber>;
            transparent: z.ZodDefault<z.ZodBoolean>;
            side: z.ZodDefault<z.ZodEnum<{
                front: "front";
                back: "back";
                double: "double";
            }>>;
        }, z.core.$strip>>;
        texture: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            repeat: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            scale: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    railingMaterialPreset: z.ZodOptional<z.ZodString>;
    treadMaterial: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        preset: z.ZodOptional<z.ZodEnum<{
            custom: "custom";
            white: "white";
            brick: "brick";
            concrete: "concrete";
            wood: "wood";
            glass: "glass";
            metal: "metal";
            plaster: "plaster";
            tile: "tile";
            marble: "marble";
        }>>;
        properties: z.ZodOptional<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            roughness: z.ZodDefault<z.ZodNumber>;
            metalness: z.ZodDefault<z.ZodNumber>;
            opacity: z.ZodDefault<z.ZodNumber>;
            transparent: z.ZodDefault<z.ZodBoolean>;
            side: z.ZodDefault<z.ZodEnum<{
                front: "front";
                back: "back";
                double: "double";
            }>>;
        }, z.core.$strip>>;
        texture: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            repeat: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            scale: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    treadMaterialPreset: z.ZodOptional<z.ZodString>;
    sideMaterial: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        preset: z.ZodOptional<z.ZodEnum<{
            custom: "custom";
            white: "white";
            brick: "brick";
            concrete: "concrete";
            wood: "wood";
            glass: "glass";
            metal: "metal";
            plaster: "plaster";
            tile: "tile";
            marble: "marble";
        }>>;
        properties: z.ZodOptional<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            roughness: z.ZodDefault<z.ZodNumber>;
            metalness: z.ZodDefault<z.ZodNumber>;
            opacity: z.ZodDefault<z.ZodNumber>;
            transparent: z.ZodDefault<z.ZodBoolean>;
            side: z.ZodDefault<z.ZodEnum<{
                front: "front";
                back: "back";
                double: "double";
            }>>;
        }, z.core.$strip>>;
        texture: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            repeat: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
            scale: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    sideMaterialPreset: z.ZodOptional<z.ZodString>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    stairType: z.ZodDefault<z.ZodEnum<{
        straight: "straight";
        spiral: "spiral";
        curved: "curved";
    }>>;
    fromLevelId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    toLevelId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    slabOpeningMode: z.ZodDefault<z.ZodEnum<{
        none: "none";
        destination: "destination";
    }>>;
    openingOffset: z.ZodDefault<z.ZodNumber>;
    width: z.ZodDefault<z.ZodNumber>;
    totalRise: z.ZodDefault<z.ZodNumber>;
    stepCount: z.ZodDefault<z.ZodNumber>;
    thickness: z.ZodDefault<z.ZodNumber>;
    fillToFloor: z.ZodDefault<z.ZodBoolean>;
    innerRadius: z.ZodDefault<z.ZodNumber>;
    sweepAngle: z.ZodDefault<z.ZodNumber>;
    topLandingMode: z.ZodDefault<z.ZodEnum<{
        none: "none";
        integrated: "integrated";
    }>>;
    topLandingDepth: z.ZodDefault<z.ZodNumber>;
    showCenterColumn: z.ZodDefault<z.ZodBoolean>;
    showStepSupports: z.ZodDefault<z.ZodBoolean>;
    railingMode: z.ZodDefault<z.ZodEnum<{
        none: "none";
        left: "left";
        right: "right";
        both: "both";
    }>>;
    railingHeight: z.ZodDefault<z.ZodNumber>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`sseg_${string}`>>>>;
}, z.core.$strip>;
export type StairNode = z.infer<typeof StairNode>;
export declare function getEffectiveStairSurfaceMaterial(node: StairNode, role: StairSurfaceMaterialRole): StairSurfaceMaterialSpec;
//# sourceMappingURL=stair.d.ts.map