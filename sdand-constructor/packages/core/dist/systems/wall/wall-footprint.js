import { getWallSurfacePolygon, isCurvedWall } from './wall-curve';
import { getWallMiterBoundaryPoints, pointToKey, } from './wall-mitering';
export const DEFAULT_WALL_THICKNESS = 0.1;
export const DEFAULT_WALL_HEIGHT = 2.5;
const CURVED_WALL_SURFACE_SEGMENTS = 24;
export function getWallThickness(wallNode) {
    return wallNode.thickness ?? DEFAULT_WALL_THICKNESS;
}
export function getWallPlanFootprint(wallNode, miterData) {
    const { junctionData } = miterData;
    const wallStart = { x: wallNode.start[0], y: wallNode.start[1] };
    const wallEnd = { x: wallNode.end[0], y: wallNode.end[1] };
    const thickness = getWallThickness(wallNode);
    const halfT = thickness / 2;
    const v = { x: wallEnd.x - wallStart.x, y: wallEnd.y - wallStart.y };
    const L = Math.sqrt(v.x * v.x + v.y * v.y);
    if (L < 1e-9) {
        return [];
    }
    const nUnit = { x: -v.y / L, y: v.x / L };
    const keyStart = pointToKey(wallStart);
    const keyEnd = pointToKey(wallEnd);
    const startJunction = junctionData.get(keyStart)?.get(wallNode.id);
    const endJunction = junctionData.get(keyEnd)?.get(wallNode.id);
    if (isCurvedWall(wallNode)) {
        const boundaryPoints = getWallMiterBoundaryPoints(wallNode, miterData);
        if (!boundaryPoints) {
            return [];
        }
        const { startLeft, startRight, endLeft, endRight } = boundaryPoints;
        return getWallSurfacePolygon(wallNode, CURVED_WALL_SURFACE_SEGMENTS, {
            endLeft,
            endRight,
            startLeft,
            startRight,
        });
    }
    const pStartLeft = startJunction?.left || {
        x: wallStart.x + nUnit.x * halfT,
        y: wallStart.y + nUnit.y * halfT,
    };
    const pStartRight = startJunction?.right || {
        x: wallStart.x - nUnit.x * halfT,
        y: wallStart.y - nUnit.y * halfT,
    };
    const pEndLeft = endJunction?.right || {
        x: wallEnd.x + nUnit.x * halfT,
        y: wallEnd.y + nUnit.y * halfT,
    };
    const pEndRight = endJunction?.left || {
        x: wallEnd.x - nUnit.x * halfT,
        y: wallEnd.y - nUnit.y * halfT,
    };
    const polygon = [pStartRight, pEndRight];
    if (endJunction) {
        polygon.push(wallEnd);
    }
    polygon.push(pEndLeft, pStartLeft);
    if (startJunction) {
        polygon.push(wallStart);
    }
    return polygon;
}
