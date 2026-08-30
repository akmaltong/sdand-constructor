import { type RoofEvent, type RoofSegmentNode } from '@pascal-app/core';
import { type RoofSegmentHit } from './roof-segment-hit';
export type RelativeRoofDragTarget = {
    segment: RoofSegmentNode;
    localX: number;
    localY: number;
    localZ: number;
    hit: RoofSegmentHit;
};
export declare function roofSegmentLocalToBuildingLocal(segmentId: string, position: [number, number, number]): [number, number, number];
export declare function createRelativeRoofDrag(original: {
    position: [number, number, number];
    roofSegmentId?: string;
}): {
    resolve: (event: RoofEvent) => RelativeRoofDragTarget | null;
};
//# sourceMappingURL=relative-roof-drag.d.ts.map