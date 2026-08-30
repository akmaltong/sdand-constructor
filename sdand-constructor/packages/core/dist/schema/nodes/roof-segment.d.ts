import { z } from 'zod';
import type { MaterialSchema as MaterialSchemaType } from '../material';
export declare const RoofType: z.ZodEnum<{
    flat: "flat";
    hip: "hip";
    gable: "gable";
    shed: "shed";
    gambrel: "gambrel";
    dutch: "dutch";
    mansard: "mansard";
}>;
export type RoofType = z.infer<typeof RoofType>;
export declare const ROOF_SHAPE_DEFAULTS: {
    /** Gambrel: lower (steep) face occupies this fraction of the horizontal half-depth. */
    readonly gambrelLowerWidthRatio: 0.5;
    /** Gambrel: lower (steep) face rises this fraction of the way to the peak. */
    readonly gambrelLowerHeightRatio: 0.6;
    /** Mansard: steep face occupies this fraction of `min(width, depth)`. */
    readonly mansardSteepWidthRatio: 0.15;
    /** Mansard: steep face rises this fraction of the way to the peak. */
    readonly mansardSteepHeightRatio: 0.7;
    /** Dutch: hip face occupies this fraction of `min(width, depth)`. */
    readonly dutchHipWidthRatio: 0.25;
    /** Dutch: hip face rises this fraction of the way to the peak. */
    readonly dutchHipHeightRatio: 0.5;
};
export declare const RoofSegmentNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`rseg_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"roof-segment">>;
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
    edgeMaterial: z.ZodOptional<z.ZodObject<{
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
    edgeMaterialPreset: z.ZodOptional<z.ZodString>;
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
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    roofType: z.ZodDefault<z.ZodEnum<{
        flat: "flat";
        hip: "hip";
        gable: "gable";
        shed: "shed";
        gambrel: "gambrel";
        dutch: "dutch";
        mansard: "mansard";
    }>>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    wallHeight: z.ZodDefault<z.ZodNumber>;
    pitch: z.ZodDefault<z.ZodNumber>;
    wallThickness: z.ZodDefault<z.ZodNumber>;
    deckThickness: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    shingleThickness: z.ZodDefault<z.ZodNumber>;
    gambrelLowerWidthRatio: z.ZodDefault<z.ZodNumber>;
    gambrelLowerHeightRatio: z.ZodDefault<z.ZodNumber>;
    mansardSteepWidthRatio: z.ZodDefault<z.ZodNumber>;
    mansardSteepHeightRatio: z.ZodDefault<z.ZodNumber>;
    dutchHipWidthRatio: z.ZodDefault<z.ZodNumber>;
    dutchHipHeightRatio: z.ZodDefault<z.ZodNumber>;
    children: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RoofSegmentNode = z.infer<typeof RoofSegmentNode>;
/** Shape of the per-type ratios consumed by the slope helpers. */
type ShapeRatios = {
    gambrelLowerWidthRatio: number;
    gambrelLowerHeightRatio: number;
    mansardSteepWidthRatio: number;
    mansardSteepHeightRatio: number;
    dutchHipWidthRatio: number;
    dutchHipHeightRatio: number;
};
type PitchInputs = {
    roofType: RoofType;
    width: number;
    depth: number;
} & Partial<ShapeRatios>;
export type SegmentSlopeFrame = {
    /** Horizontal half-span of the primary slope face (eave-to-ridge). */
    run: number;
    /** Vertical height of the primary slope face. */
    rise: number;
    /** tan(pitch). 0 for flat or zero-pitch segments. */
    tanTheta: number;
    /** cos(pitch). 1 for flat or zero-pitch segments. */
    cosTheta: number;
    /** sin(pitch). 0 for flat or zero-pitch segments. */
    sinTheta: number;
    /** Overall eave-to-peak height of the assembled roof. */
    activeRh: number;
};
/**
 * One stop for the slope math every roof-segment consumer needs. Builds
 * `run`, `rise`, the trig triple, and the overall peak height from the
 * segment's pitch + footprint + roofType. Before this helper existed,
 * the table was duplicated in three places (the brush builder, the
 * skylight surface-frame routine, and the segment-hit raycaster) and
 * silently drifted when a new roof type was added.
 */
export declare function getSegmentSlopeFrame(node: Pick<RoofSegmentNode, 'roofType' | 'pitch' | 'width' | 'depth'> & Partial<ShapeRatios>): SegmentSlopeFrame;
/**
 * The eave-to-peak height of the assembled segment, derived from pitch +
 * footprint + roofType. Replaces the legacy `roofHeight` field on the node.
 */
export declare function getActiveRoofHeight(node: Parameters<typeof getSegmentSlopeFrame>[0]): number;
/** Segment-local surface height used by roof accessory placement and hit disambiguation. */
export declare function getRoofSegmentSurfaceY(node: Pick<RoofSegmentNode, 'roofType' | 'width' | 'depth' | 'wallHeight'> & Parameters<typeof getSegmentSlopeFrame>[0], localX: number, localZ: number): number;
/**
 * Inverse of `getActiveRoofHeight` — recover the pitch a legacy
 * `roofHeight` value would correspond to. Used by the scene migration.
 * Ratio overrides are optional and default to the shape defaults.
 */
export declare function getPitchFromActiveRoofHeight(input: PitchInputs & {
    roofHeight: number;
}): number;
export type RoofSegmentSurfaceMaterialRole = 'top' | 'edge' | 'wall';
export type RoofSegmentSurfaceMaterialSpec = {
    material?: MaterialSchemaType;
    materialPreset?: string;
};
/**
 * Resolve the segment-level material for one of the three surface roles.
 * Falls back through: role-specific field → catch-all `material`. Pass the
 * parent roof to `parentFallback` when you want the roof's role material
 * to fill in for an unset segment slot — typical from the renderer.
 */
export declare function getEffectiveSegmentSurfaceMaterial(node: RoofSegmentNode, role: RoofSegmentSurfaceMaterialRole, parentFallback?: RoofSegmentSurfaceMaterialSpec): RoofSegmentSurfaceMaterialSpec;
/**
 * Returns true when the segment has any segment-level material override —
 * either the legacy catch-all or any of the three role-specific fields.
 * Used by `RoofRenderer` and `updateMergedRoofGeometry` to decide whether
 * the segment should be drawn as its own mesh or folded into the merged
 * shell.
 */
export declare function hasSegmentMaterialOverride(node: RoofSegmentNode): boolean;
export {};
//# sourceMappingURL=roof-segment.d.ts.map