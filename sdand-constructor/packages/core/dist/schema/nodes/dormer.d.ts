import { z } from 'zod';
import { MaterialSchema } from '../material';
export type DormerSurfaceMaterialRole = 'top' | 'side' | 'wall';
export type DormerSurfaceMaterialSpec = {
    material?: z.infer<typeof MaterialSchema>;
    materialPreset?: string;
};
/**
 * Default dormer dimensions and window controls. Values match the
 * legacy archive so existing scenes don't shift visually.
 */
export declare const DORMER_DEFAULTS: {
    readonly WIDTH: 1.21;
    readonly DEPTH: 1.55;
    readonly WALL_HEIGHT: 0;
    readonly ROOF_HEIGHT: 0.49;
    readonly WALL_SKIRT_HEIGHT: 2.73;
    readonly WINDOW_WIDTH: 0.76;
    readonly WINDOW_HEIGHT: 0.68;
    readonly WINDOW_OFFSET_X: 0.02;
    readonly WINDOW_OFFSET_Y: 0.99;
    readonly WINDOW_FRAME_THICKNESS: 0.05;
    readonly WINDOW_FRAME_DEPTH: 0.06;
    readonly WINDOW_COLUMNS: 3;
    readonly WINDOW_ROWS: 3;
    readonly WINDOW_DIVIDER_THICKNESS: 0.02;
    readonly WINDOW_ARCH_HEIGHT: 0.35;
    readonly WINDOW_CORNER_RADIUS: 0.15;
    readonly WINDOW_SILL_DEPTH: 0.08;
    readonly WINDOW_SILL_THICKNESS: 0.03;
};
export declare const DormerNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`dormer_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"dormer">>;
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
    topMaterial: z.ZodOptional<z.ZodObject<{
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
    topMaterialPreset: z.ZodOptional<z.ZodString>;
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
    wallMaterial: z.ZodOptional<z.ZodObject<{
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
    wallMaterialPreset: z.ZodOptional<z.ZodString>;
    roofSegmentId: z.ZodOptional<z.ZodString>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    roofType: z.ZodDefault<z.ZodEnum<{
        flat: "flat";
        hip: "hip";
        gable: "gable";
        shed: "shed";
        gambrel: "gambrel";
        dutch: "dutch";
        mansard: "mansard";
    }>>;
    roofHeight: z.ZodDefault<z.ZodNumber>;
    wallSkirtHeight: z.ZodDefault<z.ZodNumber>;
    windowWidth: z.ZodDefault<z.ZodNumber>;
    windowHeight: z.ZodDefault<z.ZodNumber>;
    windowOffsetX: z.ZodDefault<z.ZodNumber>;
    windowOffsetY: z.ZodDefault<z.ZodNumber>;
    windowFrameThickness: z.ZodDefault<z.ZodNumber>;
    windowFrameDepth: z.ZodDefault<z.ZodNumber>;
    windowColumns: z.ZodDefault<z.ZodNumber>;
    windowRows: z.ZodDefault<z.ZodNumber>;
    windowDividerThickness: z.ZodDefault<z.ZodNumber>;
    windowShape: z.ZodDefault<z.ZodEnum<{
        rectangle: "rectangle";
        rounded: "rounded";
        arch: "arch";
    }>>;
    windowArchHeight: z.ZodDefault<z.ZodNumber>;
    windowCornerRadii: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    windowSill: z.ZodDefault<z.ZodBoolean>;
    windowSillDepth: z.ZodDefault<z.ZodNumber>;
    windowSillThickness: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type DormerNode = z.infer<typeof DormerNode>;
/**
 * Per-surface material resolution. Fall-through order:
 *   top  → topMaterial[Preset]                              → legacy
 *   side → sideMaterial[Preset] → wallMaterial[Preset]      → legacy
 *   wall → wallMaterial[Preset] → sideMaterial[Preset]      → legacy
 * where legacy is `node.material` / `node.materialPreset`.
 */
export declare function getEffectiveDormerSurfaceMaterial(node: DormerNode, role: DormerSurfaceMaterialRole): DormerSurfaceMaterialSpec;
//# sourceMappingURL=dormer.d.ts.map