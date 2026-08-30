import type { WallNode } from '@pascal-app/core/schema';
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export declare function distance2D(a: Vec2, b: Vec2): number;
export declare function wallLength(wall: Pick<WallNode, 'start' | 'end'>): number;
export declare function clamp(value: number, min: number, max: number): number;
export declare function wallLocalXFromT(wall: Pick<WallNode, 'start' | 'end'>, t: number, width: number): number;
export declare function projectWorldPointToWallLocalX(wall: Pick<WallNode, 'start' | 'end'>, position: Vec3): number;
export declare function polygonArea(points: Vec2[]): number;
export declare function polygonBounds(points: Vec2[]): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    depth: number;
    centerX: number;
    centerZ: number;
};
export declare function pointInBoundsWithPadding(x: number, z: number, bounds: ReturnType<typeof polygonBounds>, padding: number): boolean;
export declare function pointOnSegment(point: Vec2, a: Vec2, b: Vec2, tolerance?: number): boolean;
export declare function pointInPolygon(point: Vec2, polygon: Vec2[], includeBoundary?: boolean): boolean;
export declare function polygonContainsPolygon(outer: Vec2[], inner: Vec2[]): boolean;
//# sourceMappingURL=geometry.d.ts.map