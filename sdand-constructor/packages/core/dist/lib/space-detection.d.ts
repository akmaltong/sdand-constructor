import { type CeilingNode as CeilingNodeType, type SlabNode as SlabNodeType, type WallNode } from '../schema';
type Point2D = {
    x: number;
    y: number;
};
export type Space = {
    id: string;
    levelId: string;
    polygon: Array<[number, number]>;
    wallIds: string[];
    isExterior: boolean;
};
type WallSideUpdate = {
    wallId: string;
    frontSide: 'interior' | 'exterior' | 'unknown';
    backSide: 'interior' | 'exterior' | 'unknown';
};
export type AutoSlabSyncPlan = {
    create: SlabNodeType[];
    update: Array<{
        id: SlabNodeType['id'];
        data: Partial<SlabNodeType>;
    }>;
    delete: Array<SlabNodeType['id']>;
};
export type AutoCeilingSyncPlan = {
    create: CeilingNodeType[];
    update: Array<{
        id: CeilingNodeType['id'];
        data: Partial<CeilingNodeType>;
    }>;
    delete: Array<CeilingNodeType['id']>;
};
export type AutoCeilingPlanningContext = {
    walls?: WallNode[];
    slabs?: SlabNodeType[];
};
export declare function resolveWallSurfaceSides(wall: Pick<WallNode, 'start' | 'end' | 'thickness' | 'frontSide' | 'backSide'>, roomPolygons: Point2D[][]): Pick<WallSideUpdate, 'frontSide' | 'backSide'>;
export declare function planAutoSlabsForLevel(roomPolygons: Point2D[][], existingSlabs: SlabNodeType[]): AutoSlabSyncPlan;
export declare function projectAutoSlabsForPlan(existingSlabs: SlabNodeType[], plan: AutoSlabSyncPlan): SlabNodeType[];
export declare function planAutoCeilingsForLevel(roomPolygons: Point2D[][], existingCeilings: CeilingNodeType[], context?: AutoCeilingPlanningContext): AutoCeilingSyncPlan;
export declare function detectSpacesForLevel(levelId: string, walls: WallNode[]): {
    roomPolygons: Point2D[][];
    spaces: Space[];
    wallUpdates: WallSideUpdate[];
};
/** Pause the wall-driven auto slab/ceiling sync. Refcounted — pair with `resumeSpaceDetection`. */
export declare function pauseSpaceDetection(): void;
/** Resume the wall-driven auto slab/ceiling sync. No-op if not currently paused. */
export declare function resumeSpaceDetection(): void;
/** True iff the wall-driven auto slab/ceiling sync is currently paused. */
export declare function isSpaceDetectionPaused(): boolean;
export declare function initSpaceDetectionSync(sceneStore: any, editorStore: any): () => void;
export declare function wallTouchesOthers(wall: WallNode, otherWalls: WallNode[]): boolean;
export {};
//# sourceMappingURL=space-detection.d.ts.map