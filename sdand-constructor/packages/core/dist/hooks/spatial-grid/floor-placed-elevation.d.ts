import type { FloorPlacedConfig, FloorPlacedFootprint, FloorPlacedFootprintContext, FloorPlacedFootprintsResolver } from '../../registry/types';
import type { AnyNode } from '../../schema';
export type FloorPlacedElevationArgs = {
    node: AnyNode;
    nodes: Record<string, AnyNode>;
    position: [number, number, number];
    rotation?: unknown;
    levelId?: string | null;
};
export declare function getFloorPlacedFootprints(floorPlaced: FloorPlacedConfig, node: AnyNode, ctx?: FloorPlacedFootprintContext): FloorPlacedFootprint[];
export declare function getFloorPlacedElevation({ node, nodes, position, rotation, levelId, }: FloorPlacedElevationArgs): number;
export declare function getFloorStackedPosition(args: FloorPlacedElevationArgs): [number, number, number];
export type { FloorPlacedFootprint, FloorPlacedFootprintContext, FloorPlacedFootprintsResolver };
//# sourceMappingURL=floor-placed-elevation.d.ts.map