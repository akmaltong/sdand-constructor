import { z } from 'zod';
export declare const FenceStyle: z.ZodEnum<{
    slat: "slat";
    rail: "rail";
    privacy: "privacy";
}>;
export declare const FenceBaseStyle: z.ZodEnum<{
    floating: "floating";
    grounded: "grounded";
}>;
export declare const FenceNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`fence_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"fence">>;
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
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    height: z.ZodDefault<z.ZodNumber>;
    thickness: z.ZodDefault<z.ZodNumber>;
    curveOffset: z.ZodOptional<z.ZodNumber>;
    baseHeight: z.ZodDefault<z.ZodNumber>;
    postSpacing: z.ZodDefault<z.ZodNumber>;
    postSize: z.ZodDefault<z.ZodNumber>;
    topRailHeight: z.ZodDefault<z.ZodNumber>;
    groundClearance: z.ZodDefault<z.ZodNumber>;
    edgeInset: z.ZodDefault<z.ZodNumber>;
    baseStyle: z.ZodDefault<z.ZodEnum<{
        floating: "floating";
        grounded: "grounded";
    }>>;
    showInfill: z.ZodDefault<z.ZodBoolean>;
    color: z.ZodDefault<z.ZodString>;
    style: z.ZodDefault<z.ZodEnum<{
        slat: "slat";
        rail: "rail";
        privacy: "privacy";
    }>>;
}, z.core.$strip>;
export type FenceNode = z.infer<typeof FenceNode>;
//# sourceMappingURL=fence.d.ts.map