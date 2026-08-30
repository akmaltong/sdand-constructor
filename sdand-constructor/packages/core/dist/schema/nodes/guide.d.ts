import { z } from 'zod';
export declare const GuideScaleReference: z.ZodObject<{
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    realLengthMeters: z.ZodNumber;
    measuredLengthUnits: z.ZodNumber;
    metersPerUnit: z.ZodNumber;
    label: z.ZodString;
}, z.core.$strip>;
export declare const GuideNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`guide_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"guide">>;
    url: z.ZodString;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    scale: z.ZodDefault<z.ZodNumber>;
    opacity: z.ZodDefault<z.ZodNumber>;
    scaleReference: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        realLengthMeters: z.ZodNumber;
        measuredLengthUnits: z.ZodNumber;
        metersPerUnit: z.ZodNumber;
        label: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type GuideScaleReference = z.infer<typeof GuideScaleReference>;
export type GuideNode = z.infer<typeof GuideNode>;
//# sourceMappingURL=guide.d.ts.map