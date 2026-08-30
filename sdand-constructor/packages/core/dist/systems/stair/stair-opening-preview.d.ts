import type { AnyNode, AnyNodeId, CeilingNode, SlabNode } from '../../schema';
import { type LiveNodeOverrides } from '../../store/use-live-node-overrides';
import type { LiveTransform } from '../../store/use-live-transforms';
type SurfaceOpeningUpdate = {
    id: AnyNodeId;
    data: Partial<SlabNode | CeilingNode>;
};
export declare function hasLiveStairOpeningInputs(nodes: Record<string, AnyNode>, liveTransforms: ReadonlyMap<string, LiveTransform>, liveOverrides: ReadonlyMap<string, LiveNodeOverrides>, previewSurfaceIds: ReadonlySet<string>): boolean;
export declare function getNodesWithLiveStairOpeningInputs(nodes: Record<string, AnyNode>, liveTransforms: ReadonlyMap<string, LiveTransform>, liveOverrides: ReadonlyMap<string, LiveNodeOverrides>, previewSurfaceIds: ReadonlySet<string>): Record<string, {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `bvent_${string}`;
    type: "box-vent";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    width: number;
    depth: number;
    height: number;
    hoodOverhang: number;
    topTaper: number;
    capHeight: number;
    capGap: number;
    domeCurvature: number;
    baseInset: number;
    baseHeight: number;
    cornerBevel: number;
    style: "box" | "cap" | "dome";
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
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `elevator_${string}`;
    type: "elevator";
    position: [number, number, number];
    rotation: number;
    width: number;
    depth: number;
    shaftWallThickness: number;
    shaftStyle: "glass" | "solid";
    cabHeight: number;
    doorWidth: number;
    doorHeight: number;
    doorStyle: "center-opening" | "single-left" | "single-right";
    doorPanelStyle: "glass-frame" | "solid-panel" | "segmented-panel";
    fromLevelId: string | null;
    toLevelId: string | null;
    disabledLevelIds: string[];
    serviceOnlyLevelIds: string[];
    defaultLevelId: string | null;
    speed: number;
    doorDurationMs: number;
    dwellMs: number;
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
    shaftWidth?: number | undefined;
    shaftDepth?: number | undefined;
    servedLevelIds?: string[] | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `item_${string}`;
    type: "item";
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    children: `item_${string}`[];
    asset: {
        id: string;
        category: string;
        name: string;
        thumbnail: string;
        source: "library" | "community" | "mine";
        src: string;
        dimensions: [number, number, number];
        offset: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
        floorPlanUrl?: string | undefined;
        isDraft?: boolean | undefined;
        attachTo?: "wall" | "ceiling" | "wall-side" | undefined;
        recessed?: boolean | undefined;
        tags?: string[] | undefined;
        functionTags?: string[] | undefined;
        surface?: {
            height: number;
        } | undefined;
        interactive?: {
            controls: ({
                kind: "toggle";
                label?: string | undefined;
                default?: boolean | undefined;
            } | {
                kind: "slider";
                label: string;
                min: number;
                max: number;
                step: number;
                displayMode: "slider" | "stepper" | "dial";
                unit?: string | undefined;
                default?: number | undefined;
            } | {
                kind: "temperature";
                label: string;
                min: number;
                max: number;
                unit: "C" | "F";
                default?: number | undefined;
            })[];
            effects: ({
                kind: "animation";
                clips: {
                    on?: string | undefined;
                    off?: string | undefined;
                    loop?: string | undefined;
                };
            } | {
                kind: "light";
                color: string;
                intensityRange: [number, number];
                offset: [number, number, number];
                distance?: number | undefined;
            })[];
        } | undefined;
    };
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
    side?: "front" | "back" | undefined;
    wallId?: string | undefined;
    wallT?: number | undefined;
    collectionIds?: `collection_${string}`[] | undefined;
} | {
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
        source: "stair" | "elevator" | "manual";
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
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `column_${string}`;
    type: "column";
    position: [number, number, number];
    rotation: number;
    style: "plain" | "faceted" | "fluted" | "lathe-turned" | "dravidian-carved" | "cluster";
    crossSection: "round" | "square" | "rectangular" | "octagonal" | "sixteen-sided";
    height: number;
    radius: number;
    width: number;
    depth: number;
    edgeSoftness: number;
    baseHeight: number;
    capitalHeight: number;
    shaftProfile: "straight" | "tapered" | "bulged" | "baluster" | "hourglass";
    shaftTaper: number;
    shaftBulge: number;
    shaftStartScale: number;
    shaftEndScale: number;
    shaftSegmentCount: number;
    shaftTwistStep: number;
    shaftCornerRadius: number;
    shaftDetail: "fluted" | "lathe-turned" | "none" | "spiral" | "panelled";
    baseStyle: "none" | "simple-square" | "round-rings" | "square-plinth" | "stepped-square" | "lotus" | "ribbed-lotus" | "panelled-pedestal";
    baseWidthScale: number;
    baseDepthScale: number;
    baseTierCount: number;
    baseStepSpread: number;
    basePlinthHeightRatio: number;
    baseRoundBandScale: number;
    baseNeckScale: number;
    baseRoundBandCount: number;
    baseRibCount: number;
    baseCarvingLevel: number;
    basePanelInset: number;
    capitalStyle: "none" | "simple" | "simple-slab" | "rounded" | "stepped" | "doric" | "volute" | "ionic-volute" | "leaf-carved" | "corinthian-leaf" | "south-indian-bracket" | "wood-bracket";
    capitalWidthScale: number;
    capitalDepthScale: number;
    capitalTierCount: number;
    capitalStepSpread: number;
    capitalBandCount: number;
    voluteSize: number;
    voluteCount: number;
    leafCount: number;
    leafRows: number;
    bracketDepth: number;
    bracketTierCount: number;
    pendantCount: number;
    capitalCarvingLevel: number;
    ringCount: number;
    ringPlacement: "ends" | "even" | "top" | "bottom";
    ringThickness: number;
    ringSpread: number;
    fluteCount: number;
    fluteDepth: number;
    fluteWidth: number;
    spiralTwist: number;
    spiralRibCount: number;
    panelCount: number;
    panelInsetDepth: number;
    panelShape: "rectangle" | "arched" | "diamond";
    latheRingCount: number;
    latheRingSpacing: "ends" | "even" | "top" | "bottom";
    carvingLevel: number;
    carvingPlacement: "shaft" | "base" | "capital" | "all";
    lowerBandEnabled: boolean;
    lowerBandHeight: number;
    lowerBandCarvingLevel: number;
    dentilCount: number;
    beadCount: number;
    supportStyle: "vertical" | "a-frame" | "y-frame" | "v-frame" | "x-brace" | "k-brace" | "single-strut" | "tripod" | "trestle" | "portal-frame" | "box-frame";
    braceWidth: number;
    braceDepth: number;
    braceBottomSpread: number;
    braceTopSpread: number;
    bracePlateEnabled: boolean;
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
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `fence_${string}`;
    type: "fence";
    start: [number, number];
    end: [number, number];
    height: number;
    thickness: number;
    baseHeight: number;
    postSpacing: number;
    postSize: number;
    topRailHeight: number;
    groundClearance: number;
    edgeInset: number;
    baseStyle: "floating" | "grounded";
    showInfill: boolean;
    color: string;
    style: "slat" | "rail" | "privacy";
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
    curveOffset?: number | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `guide_${string}`;
    type: "guide";
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    opacity: number;
    scaleReference: {
        start: [number, number];
        end: [number, number];
        realLengthMeters: number;
        measuredLengthUnits: number;
        metersPerUnit: number;
        label: string;
    } | null;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `rseg_${string}`;
    type: "roof-segment";
    position: [number, number, number];
    rotation: number;
    roofType: "flat" | "hip" | "gable" | "shed" | "gambrel" | "dutch" | "mansard";
    width: number;
    depth: number;
    wallHeight: number;
    pitch: number;
    wallThickness: number;
    deckThickness: number;
    overhang: number;
    shingleThickness: number;
    gambrelLowerWidthRatio: number;
    gambrelLowerHeightRatio: number;
    mansardSteepWidthRatio: number;
    mansardSteepHeightRatio: number;
    dutchHipWidthRatio: number;
    dutchHipHeightRatio: number;
    children: string[];
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
    topMaterial?: {
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
    topMaterialPreset?: string | undefined;
    edgeMaterial?: {
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
    edgeMaterialPreset?: string | undefined;
    wallMaterial?: {
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
    wallMaterialPreset?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `roof_${string}`;
    type: "roof";
    position: [number, number, number];
    rotation: number;
    children: `rseg_${string}`[];
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
    topMaterial?: {
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
    topMaterialPreset?: string | undefined;
    edgeMaterial?: {
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
    edgeMaterialPreset?: string | undefined;
    wallMaterial?: {
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
    wallMaterialPreset?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `scan_${string}`;
    type: "scan";
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    opacity: number;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `shelf_${string}`;
    type: "shelf";
    children: `item_${string}`[];
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    depth: number;
    thickness: number;
    height: number;
    style: "wall-shelf" | "bookshelf" | "open-rack" | "cubby";
    rows: number;
    columns: number;
    withBack: boolean;
    withSides: boolean;
    withBottom: boolean;
    bracketStyle: "minimal" | "industrial" | "hidden";
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
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `slab_${string}`;
    type: "slab";
    polygon: [number, number][];
    holes: [number, number][][];
    holeMetadata: {
        source: "stair" | "elevator" | "manual";
        stairId?: string | undefined;
        elevatorId?: string | undefined;
    }[];
    elevation: number;
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
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `spawn_${string}`;
    type: "spawn";
    position: [number, number, number];
    rotation: number;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `sseg_${string}`;
    type: "stair-segment";
    position: [number, number, number];
    rotation: number;
    segmentType: "stair" | "landing";
    width: number;
    length: number;
    height: number;
    stepCount: number;
    attachmentSide: "front" | "left" | "right";
    fillToFloor: boolean;
    thickness: number;
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
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `stair_${string}`;
    type: "stair";
    position: [number, number, number];
    rotation: number;
    stairType: "straight" | "spiral" | "curved";
    fromLevelId: string | null;
    toLevelId: string | null;
    slabOpeningMode: "none" | "destination";
    openingOffset: number;
    width: number;
    totalRise: number;
    stepCount: number;
    thickness: number;
    fillToFloor: boolean;
    innerRadius: number;
    sweepAngle: number;
    topLandingMode: "none" | "integrated";
    topLandingDepth: number;
    showCenterColumn: boolean;
    showStepSupports: boolean;
    railingMode: "none" | "left" | "right" | "both";
    railingHeight: number;
    children: `sseg_${string}`[];
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
    railingMaterial?: {
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
    railingMaterialPreset?: string | undefined;
    treadMaterial?: {
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
    treadMaterialPreset?: string | undefined;
    sideMaterial?: {
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
    sideMaterialPreset?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `door_${string}`;
    type: "door";
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    height: number;
    doorCategory: "interior" | "garage";
    doorType: "double" | "hinged" | "french" | "folding" | "pocket" | "barn" | "sliding" | "garage-sectional" | "garage-rollup" | "garage-tiltup";
    leafCount: 4 | 1 | 2 | 3;
    operationState: number;
    slideDirection: "left" | "right";
    trackStyle: "visible" | "none" | "pocket" | "overhead";
    garagePanelCount: number;
    openingKind: "door" | "opening";
    openingShape: "rectangle" | "rounded" | "arch";
    openingRadiusMode: "all" | "individual";
    openingTopRadii: [number, number];
    cornerRadius: number;
    archHeight: number;
    openingRevealRadius: number;
    frameThickness: number;
    frameDepth: number;
    threshold: boolean;
    thresholdHeight: number;
    hingesSide: "left" | "right";
    swingDirection: "inward" | "outward";
    swingAngle: number;
    segments: {
        type: "glass" | "panel" | "empty";
        heightRatio: number;
        columnRatios: number[];
        dividerThickness: number;
        panelDepth: number;
        panelInset: number;
    }[];
    handle: boolean;
    handleHeight: number;
    handleSide: "left" | "right";
    contentPadding: [number, number];
    doorCloser: boolean;
    panicBar: boolean;
    panicBarHeight: number;
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
    side?: "front" | "back" | undefined;
    wallId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `window_${string}`;
    type: "window";
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    height: number;
    openingKind: "window" | "opening";
    windowType: "sliding" | "fixed" | "casement" | "awning" | "hopper" | "single-hung" | "double-hung" | "bay" | "bow" | "louvered";
    operationState: number;
    awningDirection: "up" | "down";
    casementStyle: "french" | "single";
    hingesSide: "left" | "right";
    openingShape: "rectangle" | "rounded" | "arch";
    openingRadiusMode: "all" | "individual";
    openingCornerRadii: [number, number, number, number];
    cornerRadius: number;
    archHeight: number;
    openingRevealRadius: number;
    frameThickness: number;
    frameDepth: number;
    columnRatios: number[];
    rowRatios: number[];
    columnDividerThickness: number;
    rowDividerThickness: number;
    sill: boolean;
    sillDepth: number;
    sillThickness: number;
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
    side?: "front" | "back" | undefined;
    wallId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `wall_${string}`;
    type: "wall";
    children: (`item_${string}` | `door_${string}` | `window_${string}`)[];
    start: [number, number];
    end: [number, number];
    frontSide: "unknown" | "interior" | "exterior";
    backSide: "unknown" | "interior" | "exterior";
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
    interiorMaterial?: {
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
    interiorMaterialPreset?: string | undefined;
    exteriorMaterial?: {
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
    exteriorMaterialPreset?: string | undefined;
    thickness?: number | undefined;
    height?: number | undefined;
    curveOffset?: number | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    id: `zone_${string}`;
    type: "zone";
    name: string;
    polygon: [number, number][];
    color: string;
    metadata: import("zod").JSONType;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `level_${string}`;
    type: "level";
    children: (`item_${string}` | `ceiling_${string}` | `column_${string}` | `fence_${string}` | `guide_${string}` | `roof_${string}` | `scan_${string}` | `shelf_${string}` | `slab_${string}` | `spawn_${string}` | `stair_${string}` | `wall_${string}` | `zone_${string}`)[];
    level: number;
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `building_${string}`;
    type: "building";
    children: (`elevator_${string}` | `level_${string}`)[];
    position: [number, number, number];
    rotation: [number, number, number];
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `chimney_${string}`;
    type: "chimney";
    position: [number, number, number];
    rotation: number;
    bodyShape: "round" | "square";
    bodyHollowDepth: number;
    bodyHollowMargin: number;
    width: number;
    depth: number;
    heightAboveRidge: number;
    cutoutOffset: number;
    cornerBevel: number;
    cap: boolean;
    capShape: "flat" | "none" | "stepped" | "sloped";
    capOverhang: number;
    capThickness: number;
    flueCount: number;
    flueShape: "round" | "square";
    flueHeight: number;
    flueDiameter: number;
    flueSpacing: number;
    flueWallThickness: number;
    shoulderStyle: "tapered" | "none" | "corbeled";
    shoulderHeight: number;
    shoulderExtent: number;
    bandStyle: "double" | "none" | "single";
    bandHeight: number;
    bandExtent: number;
    bandOffset: number;
    cricketStyle: "none" | "simple";
    cricketLength: number;
    cricketHeight: number;
    cricketSide: "front" | "back";
    panelStyle: "rectangular" | "none";
    panelDepth: number;
    panelHeight: number;
    panelOffsetTop: number;
    panelMargin: number;
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
    topMaterial?: {
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
    topMaterialPreset?: string | undefined;
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `cupola_${string}`;
    type: "cupola";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    width: number;
    depth: number;
    height: number;
    roofStyle: "dome" | "pyramid";
    finial: boolean;
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
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `dormer_${string}`;
    type: "dormer";
    position: [number, number, number];
    rotation: number;
    width: number;
    depth: number;
    height: number;
    roofType: "flat" | "hip" | "gable" | "shed" | "gambrel" | "dutch" | "mansard";
    roofHeight: number;
    wallSkirtHeight: number;
    windowWidth: number;
    windowHeight: number;
    windowOffsetX: number;
    windowOffsetY: number;
    windowFrameThickness: number;
    windowFrameDepth: number;
    windowColumns: number;
    windowRows: number;
    windowDividerThickness: number;
    windowShape: "rectangle" | "rounded" | "arch";
    windowArchHeight: number;
    windowCornerRadii: [number, number, number, number];
    windowSill: boolean;
    windowSillDepth: number;
    windowSillThickness: number;
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
    topMaterial?: {
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
    topMaterialPreset?: string | undefined;
    sideMaterial?: {
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
    sideMaterialPreset?: string | undefined;
    wallMaterial?: {
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
    wallMaterialPreset?: string | undefined;
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `downspout_${string}`;
    type: "downspout";
    materialPreset: string;
    length: number;
    diameter: number;
    standoff: number;
    shape: "round" | "auto" | "rect";
    strapStyle: "none" | "band";
    strapSpacing: number;
    terminal: "straight" | "splash" | "kickout";
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
    gutterId?: string | undefined;
    outletId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `eyebrow-vent_${string}`;
    type: "eyebrow-vent";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    width: number;
    depth: number;
    height: number;
    style: "scoop" | "half-round" | "slant-box";
    louverCount: number;
    backRatio: number;
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
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `gutter_${string}`;
    type: "gutter";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    length: number;
    size: number;
    thickness: number;
    profile: "box" | "half-round" | "k-style";
    endCapLeft: boolean;
    endCapRight: boolean;
    hangerStyle: "none" | "strap";
    hangerSpacing: number;
    outlets: {
        id: string;
        offset: number;
        diameter: number;
    }[];
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
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `rvent_${string}`;
    type: "ridge-vent";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    length: number;
    width: number;
    height: number;
    style: "metal" | "standard" | "shingled";
    endCaps: boolean;
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
    roofSegmentId?: string | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `site_${string}`;
    type: "site";
    polygon: {
        type: "polygon";
        points: [number, number][];
    };
    children: string[];
    name?: string | undefined;
    camera?: {
        position: [number, number, number];
        target: [number, number, number];
        mode: "perspective" | "orthographic";
        fov?: number | undefined;
        zoom?: number | undefined;
    } | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `skylight_${string}`;
    type: "skylight";
    position: [number, number, number];
    rotation: number;
    width: number;
    height: number;
    frameThickness: number;
    frameDepth: number;
    skylightType: "flat" | "sliding" | "opening" | "walk-on" | "lantern";
    glassThickness: number;
    lanternHeight: number;
    lanternTopScale: number;
    openingAngle: number;
    openingSide: "top" | "bottom" | "left" | "right";
    operationState: number;
    motorHousing: boolean;
    slideFraction: number;
    slideDirection: "x" | "z";
    trackWidth: number;
    motorHousingSize: number;
    curb: boolean;
    curbHeight: number;
    cutoutOffset: number;
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
    glassMaterial?: {
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
    glassMaterialPreset?: string | undefined;
    roofSegmentId?: string | undefined;
    surfaceNormal?: [number, number, number] | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `solarpanel_${string}`;
    type: "solar-panel";
    position: [number, number, number];
    rotation: number;
    rows: number;
    columns: number;
    panelWidth: number;
    panelHeight: number;
    gapX: number;
    gapY: number;
    mountingType: "flush" | "tilted";
    tiltAngle: number;
    standoffHeight: number;
    frameThickness: number;
    frameDepth: number;
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
    panelMaterial?: {
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
    panelMaterialPreset?: string | undefined;
    panelTypePreset?: "residential" | "residential-large" | "compact" | "frameless" | undefined;
    roofSegmentId?: string | undefined;
    surfaceNormal?: [number, number, number] | undefined;
} | {
    object: "node";
    parentId: string | null;
    visible: boolean;
    metadata: import("zod").JSONType;
    id: `tvent_${string}`;
    type: "turbine-vent";
    materialPreset: string;
    position: [number, number, number];
    rotation: number;
    diameter: number;
    height: number;
    neckHeight: number;
    baseOverhang: number;
    vaneCount: number;
    spinSpeed: number;
    style: "globe" | "cylinder";
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
    roofSegmentId?: string | undefined;
}>;
export declare function createSurfaceOpeningPreviewController(): {
    previewSurfaceIds: Set<`bvent_${string}` | `elevator_${string}` | `item_${string}` | `ceiling_${string}` | `column_${string}` | `fence_${string}` | `guide_${string}` | `rseg_${string}` | `roof_${string}` | `scan_${string}` | `shelf_${string}` | `slab_${string}` | `spawn_${string}` | `sseg_${string}` | `stair_${string}` | `door_${string}` | `window_${string}` | `wall_${string}` | `zone_${string}` | `level_${string}` | `building_${string}` | `chimney_${string}` | `cupola_${string}` | `dormer_${string}` | `downspout_${string}` | `eyebrow-vent_${string}` | `gutter_${string}` | `rvent_${string}` | `site_${string}` | `skylight_${string}` | `solarpanel_${string}` | `tvent_${string}`>;
    apply(updates: SurfaceOpeningUpdate[]): void;
    clear(): void;
};
export {};
//# sourceMappingURL=stair-opening-preview.d.ts.map