import { type AnyNode, type GridEvent, type NodeEvent, resolveAlignment } from '@pascal-app/core';
export declare const FLOOR_PLACEMENT_ALIGNMENT_THRESHOLD_M = 0.08;
export declare const FLOOR_PLACEMENT_CLICK_TRIGGER_KINDS: readonly ["shelf", "item", "slab", "ceiling", "wall", "fence", "column", "roof", "roof-segment", "stair", "stair-segment"];
export type FloorPlacementClickTriggerEvent = GridEvent | NodeEvent<AnyNode>;
type FloorPlacementAlignmentArgs = {
    node: AnyNode;
    rawX: number;
    rawZ: number;
    gridStep: number;
    candidates: Parameters<typeof resolveAlignment>[0]['candidates'];
    bypassAlignment?: boolean;
    rotationY?: number;
};
export declare function getLevelLocalSnappedPosition(levelId: string, event: FloorPlacementClickTriggerEvent, gridStep: number): [number, number, number];
export declare function resolveAlignedFloorPlacement({ node, rawX, rawZ, gridStep, candidates, bypassAlignment, rotationY, }: FloorPlacementAlignmentArgs): {
    position: [number, number, number];
    guides: import("@pascal-app/core").AlignmentGuide[];
};
export declare function stopPlacementCommitPropagation(event: FloorPlacementClickTriggerEvent): void;
export declare function subscribeFloorPlacementClicks(onClick: (event: FloorPlacementClickTriggerEvent) => void): () => void;
export {};
//# sourceMappingURL=floor-placement.d.ts.map