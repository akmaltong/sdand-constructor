import { z } from 'zod';
export declare const GutterOutlet: z.ZodObject<{
    id: z.ZodString;
    offset: z.ZodDefault<z.ZodNumber>;
    diameter: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type GutterOutlet = z.infer<typeof GutterOutlet>;
export declare const GutterNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`gutter_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"gutter">>;
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
    materialPreset: z.ZodDefault<z.ZodString>;
    roofSegmentId: z.ZodOptional<z.ZodString>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    length: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    thickness: z.ZodDefault<z.ZodNumber>;
    profile: z.ZodDefault<z.ZodEnum<{
        box: "box";
        "half-round": "half-round";
        "k-style": "k-style";
    }>>;
    endCapLeft: z.ZodDefault<z.ZodBoolean>;
    endCapRight: z.ZodDefault<z.ZodBoolean>;
    hangerStyle: z.ZodDefault<z.ZodEnum<{
        none: "none";
        strap: "strap";
    }>>;
    hangerSpacing: z.ZodDefault<z.ZodNumber>;
    outlets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        offset: z.ZodDefault<z.ZodNumber>;
        diameter: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type GutterNode = z.infer<typeof GutterNode>;
//# sourceMappingURL=gutter.d.ts.map