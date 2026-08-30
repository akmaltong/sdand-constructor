import { resolveLevelId } from '../../hooks/spatial-grid/spatial-grid-sync';
import { resolveElevatorServiceLevels } from './elevator-service';
const ELEVATOR_OPENING_PADDING = 0.08;
const DEFAULT_ELEVATOR_SHAFT_WALL_THICKNESS = 0.09;
function pointsEqual(a, b, tolerance = 1e-5) {
    const dx = a[0] - b[0];
    const dz = a[1] - b[1];
    return dx * dx + dz * dz <= tolerance * tolerance;
}
function polygonsEqual(left, right) {
    if (left.length !== right.length)
        return false;
    return left.every((polygon, polygonIndex) => {
        const other = right[polygonIndex];
        if (!(other && polygon.length === other.length))
            return false;
        return polygon.every((point, pointIndex) => {
            const otherPoint = other[pointIndex];
            if (!otherPoint)
                return false;
            return pointsEqual(point, otherPoint);
        });
    });
}
function metadataEqual(left, right) {
    if (left.length !== right.length)
        return false;
    return left.every((entry, index) => entry.source === right[index]?.source &&
        (entry.elevatorId ?? null) === (right[index]?.elevatorId ?? null) &&
        (entry.stairId ?? null) === (right[index]?.stairId ?? null));
}
function normalizeExistingMetadata(holes, metadata) {
    return holes.map((_, index) => metadata?.[index] ?? { source: 'manual' });
}
function rotateXZ(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos + z * sin, -x * sin + z * cos];
}
function pointOnSegment(point, a, b, tolerance = 1e-6) {
    const cross = (point[1] - a[1]) * (b[0] - a[0]) - (point[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(cross) > tolerance)
        return false;
    const dot = (point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1]);
    if (dot < -tolerance)
        return false;
    const lenSq = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    return dot <= lenSq + tolerance;
}
function pointInPolygon(point, polygon) {
    if (polygon.length < 3)
        return false;
    let inside = false;
    const [x, z] = point;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        if (pointOnSegment(point, a, b))
            return true;
        const intersects = a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0];
        if (intersects)
            inside = !inside;
    }
    return inside;
}
function polygonContainsPolygon(outer, inner) {
    return inner.every((point) => pointInPolygon(point, outer));
}
function isCoveredByExistingHole(existingHoles, autoHole) {
    return existingHoles.some((existingHole) => polygonContainsPolygon(existingHole, autoHole));
}
function getServedLevelRange(elevator, nodes) {
    const servedLevels = resolveElevatorServiceLevels(elevator, nodes);
    if (servedLevels.length < 2)
        return null;
    const levelNumbers = servedLevels.map((level) => level.level);
    return {
        max: Math.max(...levelNumbers),
        min: Math.min(...levelNumbers),
        sortedServedLevels: servedLevels,
    };
}
function getLevelNumber(levelId, nodes) {
    if (!levelId)
        return undefined;
    const node = nodes[levelId];
    return node?.type === 'level' ? node.level : undefined;
}
function shouldApplyElevatorToSlab(elevator, slabLevelId, nodes) {
    const range = getServedLevelRange(elevator, nodes);
    if (!range)
        return false;
    const slabLevel = getLevelNumber(slabLevelId, nodes);
    if (slabLevel !== undefined) {
        return slabLevel > range.min && slabLevel <= range.max;
    }
    const servedIndex = range.sortedServedLevels.findIndex((level) => level.id === slabLevelId);
    return servedIndex > 0;
}
function shouldApplyElevatorToCeiling(elevator, ceilingLevelId, nodes) {
    const range = getServedLevelRange(elevator, nodes);
    if (!range)
        return false;
    const ceilingLevel = getLevelNumber(ceilingLevelId, nodes);
    if (ceilingLevel !== undefined) {
        return ceilingLevel >= range.min && ceilingLevel < range.max;
    }
    const servedIndex = range.sortedServedLevels.findIndex((level) => level.id === ceilingLevelId);
    return servedIndex >= 0 && servedIndex < range.sortedServedLevels.length - 1;
}
function getElevatorOpeningPolygon(elevator) {
    const wallThickness = Math.max(elevator.shaftWallThickness ?? DEFAULT_ELEVATOR_SHAFT_WALL_THICKNESS, 0.04);
    const shaftWidth = Math.max(elevator.shaftWidth ?? elevator.width, elevator.width, 0.8);
    const shaftDepth = Math.max(elevator.shaftDepth ?? elevator.depth, elevator.depth, 0.8);
    const halfWidth = shaftWidth / 2 + wallThickness + ELEVATOR_OPENING_PADDING;
    const halfDepth = shaftDepth / 2 + wallThickness + ELEVATOR_OPENING_PADDING;
    const corners = [
        [-halfWidth, -halfDepth],
        [halfWidth, -halfDepth],
        [halfWidth, halfDepth],
        [-halfWidth, halfDepth],
    ];
    return corners.map(([x, z]) => {
        const [rotatedX, rotatedZ] = rotateXZ(x, z, elevator.rotation ?? 0);
        return [elevator.position[0] + rotatedX, elevator.position[2] + rotatedZ];
    });
}
export function syncAutoElevatorOpenings(nodes) {
    const elevators = Object.values(nodes).filter((node) => node.type === 'elevator' && node.visible !== false);
    const slabs = Object.values(nodes).filter((node) => node.type === 'slab');
    const ceilings = Object.values(nodes).filter((node) => node.type === 'ceiling');
    const updates = [];
    for (const slab of slabs) {
        const slabLevelId = resolveLevelId(slab, nodes);
        const existingHoles = slab.holes ?? [];
        const existingMetadata = normalizeExistingMetadata(existingHoles, slab.holeMetadata);
        const preservedHoles = existingHoles
            .map((polygon, index) => ({ metadata: existingMetadata[index], polygon }))
            .filter((entry) => entry.metadata.source !== 'elevator');
        const manualHoles = preservedHoles.filter((entry) => entry.metadata.source !== 'stair');
        const stairHoles = preservedHoles.filter((entry) => entry.metadata.source === 'stair');
        const preservedHolePolygons = preservedHoles.map((entry) => entry.polygon);
        const elevatorHoles = elevators
            .filter((elevator) => shouldApplyElevatorToSlab(elevator, slabLevelId, nodes))
            .map((elevator) => ({
            polygon: getElevatorOpeningPolygon(elevator),
            metadata: {
                elevatorId: elevator.id,
                source: 'elevator',
            },
        }))
            .filter((hole) => polygonContainsPolygon(slab.polygon, hole.polygon))
            .filter((hole) => !isCoveredByExistingHole(preservedHolePolygons, hole.polygon));
        const nextHoles = [
            ...manualHoles.map((hole) => hole.polygon),
            ...elevatorHoles.map((hole) => hole.polygon),
            ...stairHoles.map((hole) => hole.polygon),
        ];
        const nextMetadata = [
            ...manualHoles.map((hole) => ({ ...hole.metadata })),
            ...elevatorHoles.map((hole) => hole.metadata),
            ...stairHoles.map((hole) => ({ ...hole.metadata })),
        ];
        if (!polygonsEqual(existingHoles, nextHoles) ||
            !metadataEqual(existingMetadata, nextMetadata)) {
            updates.push({
                id: slab.id,
                data: {
                    holes: nextHoles,
                    holeMetadata: nextMetadata,
                },
            });
        }
    }
    for (const ceiling of ceilings) {
        const ceilingLevelId = resolveLevelId(ceiling, nodes);
        const existingHoles = ceiling.holes ?? [];
        const existingMetadata = normalizeExistingMetadata(existingHoles, ceiling.holeMetadata);
        const preservedHoles = existingHoles
            .map((polygon, index) => ({ metadata: existingMetadata[index], polygon }))
            .filter((entry) => entry.metadata.source !== 'elevator');
        const manualHoles = preservedHoles.filter((entry) => entry.metadata.source !== 'stair');
        const stairHoles = preservedHoles.filter((entry) => entry.metadata.source === 'stair');
        const preservedHolePolygons = preservedHoles.map((entry) => entry.polygon);
        const elevatorHoles = elevators
            .filter((elevator) => shouldApplyElevatorToCeiling(elevator, ceilingLevelId, nodes))
            .map((elevator) => ({
            polygon: getElevatorOpeningPolygon(elevator),
            metadata: {
                elevatorId: elevator.id,
                source: 'elevator',
            },
        }))
            .filter((hole) => polygonContainsPolygon(ceiling.polygon, hole.polygon))
            .filter((hole) => !isCoveredByExistingHole(preservedHolePolygons, hole.polygon));
        const nextHoles = [
            ...manualHoles.map((hole) => hole.polygon),
            ...elevatorHoles.map((hole) => hole.polygon),
            ...stairHoles.map((hole) => hole.polygon),
        ];
        const nextMetadata = [
            ...manualHoles.map((hole) => ({ ...hole.metadata })),
            ...elevatorHoles.map((hole) => hole.metadata),
            ...stairHoles.map((hole) => ({ ...hole.metadata })),
        ];
        if (!polygonsEqual(existingHoles, nextHoles) ||
            !metadataEqual(existingMetadata, nextMetadata)) {
            updates.push({
                id: ceiling.id,
                data: {
                    holes: nextHoles,
                    holeMetadata: nextMetadata,
                },
            });
        }
    }
    return updates;
}
