import { resolveBuildingForLevel, resolveLevelId } from '../../hooks/spatial-grid/spatial-grid-sync';
import { polygonContainsPolygon, polygonsOverlap } from '../../lib/polygon-relations';
import { DEFAULT_WALL_HEIGHT } from '../wall/wall-footprint';
import { computeSegmentTransforms, rotateXZ } from './stair-footprint';
const CURVED_STAIR_SLAB_OPENING_RATIO = 0.8;
const STRAIGHT_STAIR_TARGET_THRESHOLD_MIN = 0.35;
const STAIR_SLAB_OPENING_TIGHTENING = 0;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
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
// (Removing expandPolygonRadially in favor of geometric expansion inside the polygon generators)
// `rotateXZ` + `computeSegmentTransforms` are shared with the alignment-anchor
// footprint via `./stair-footprint` so both derive the chain identically.
function getLevelNumber(levelId, nodes) {
    if (!levelId)
        return undefined;
    const node = nodes[levelId];
    return node?.type === 'level' ? node.level : undefined;
}
function getLevelBuildingId(levelId, nodes) {
    if (!levelId)
        return null;
    return resolveBuildingForLevel(levelId, nodes);
}
function normalizeLevelId(levelId, nodes) {
    if (!levelId)
        return null;
    return nodes[levelId]?.type === 'level' ? levelId : null;
}
function getBuildingLevels(buildingId, nodes) {
    const building = buildingId ? nodes[buildingId] : null;
    if (building?.type !== 'building')
        return [];
    const levels = new Map();
    for (const childId of building.children ?? []) {
        const child = nodes[childId];
        if (child?.type === 'level')
            levels.set(child.id, child);
    }
    for (const candidate of Object.values(nodes)) {
        if (candidate?.type === 'level' && candidate.parentId === building.id) {
            levels.set(candidate.id, candidate);
        }
    }
    return Array.from(levels.values()).sort((left, right) => left.level - right.level);
}
function inferSourceLevelForDestination(destinationLevelId, nodes) {
    if (!destinationLevelId)
        return null;
    const destination = nodes[destinationLevelId];
    if (destination?.type !== 'level')
        return null;
    const buildingId = getLevelBuildingId(destinationLevelId, nodes);
    return (getBuildingLevels(buildingId, nodes)
        .filter((level) => level.level < destination.level)
        .at(-1)?.id ?? null);
}
function inferDestinationLevelForSource(sourceLevelId, nodes) {
    if (!sourceLevelId)
        return null;
    const source = nodes[sourceLevelId];
    if (source?.type !== 'level')
        return null;
    const buildingId = getLevelBuildingId(sourceLevelId, nodes);
    return (getBuildingLevels(buildingId, nodes).find((level) => level.level > source.level)?.id ?? null);
}
function levelsShareBuilding(leftLevelId, rightLevelId, nodes) {
    if (!(leftLevelId && rightLevelId))
        return true;
    const leftBuildingId = getLevelBuildingId(leftLevelId, nodes);
    const rightBuildingId = getLevelBuildingId(rightLevelId, nodes);
    return !(leftBuildingId && rightBuildingId && leftBuildingId !== rightBuildingId);
}
function isInStairBuildingScope(stair, surfaceLevelId, nodes) {
    const { fromLevelId, toLevelId } = getResolvedStairLevelIds(stair, nodes);
    const fromBuildingId = getLevelBuildingId(fromLevelId, nodes);
    const toBuildingId = getLevelBuildingId(toLevelId, nodes);
    const surfaceBuildingId = getLevelBuildingId(surfaceLevelId, nodes);
    if (fromBuildingId && toBuildingId && fromBuildingId !== toBuildingId)
        return false;
    if (fromBuildingId && surfaceBuildingId && fromBuildingId !== surfaceBuildingId)
        return false;
    if (toBuildingId && surfaceBuildingId && toBuildingId !== surfaceBuildingId)
        return false;
    return true;
}
function getResolvedStairLevelIds(stair, nodes) {
    const parentLevelId = normalizeLevelId(resolveLevelId(stair, nodes), nodes);
    const explicitToLevelId = normalizeLevelId(stair.toLevelId, nodes);
    const fromLevelId = normalizeLevelId(stair.fromLevelId, nodes) ??
        parentLevelId ??
        inferSourceLevelForDestination(explicitToLevelId, nodes);
    const explicitToLevelIsUsable = explicitToLevelId &&
        explicitToLevelId !== fromLevelId &&
        levelsShareBuilding(fromLevelId, explicitToLevelId, nodes);
    const toLevelId = explicitToLevelIsUsable
        ? explicitToLevelId
        : inferDestinationLevelForSource(fromLevelId, nodes);
    return { fromLevelId, toLevelId };
}
function resolveStraightSegments(stair, nodes) {
    return (stair.children ?? [])
        .map((childId) => nodes[childId])
        .filter((segment) => segment?.type === 'stair-segment' && segment.visible !== false);
}
function toWorldPlanPoint(stair, localX, localZ) {
    const [worldX, worldZ] = rotateXZ(localX, localZ, stair.rotation ?? 0);
    return [stair.position[0] + worldX, stair.position[2] + worldZ];
}
function getStraightStairLayouts(stair, nodes) {
    const segments = resolveStraightSegments(stair, nodes);
    const transforms = computeSegmentTransforms(segments);
    return segments.map((segment, index) => {
        const transform = transforms[index] ?? {
            position: [0, 0, 0],
            rotation: 0,
        };
        return {
            segment,
            transform,
            topElevation: transform.position[1] + (segment.segmentType === 'stair' ? segment.height : 0),
        };
    });
}
function getStraightSegmentFootprintPolygon(stair, layout) {
    return getStraightSegmentSlicePolygon(stair, layout, 0, layout.segment.length);
}
function getStraightSegmentLocalSlicePolygon(layout, startAlong, endAlong) {
    const { segment, transform } = layout;
    const clampedStart = clamp(startAlong, 0, segment.length);
    const clampedEnd = clamp(endAlong, clampedStart, segment.length);
    const sliceLength = Math.max(clampedEnd - clampedStart, 1e-4);
    const sliceCenterAlong = clampedStart + sliceLength / 2;
    const [centerOffsetX, centerOffsetZ] = rotateXZ(0, sliceCenterAlong, transform.rotation);
    const centerX = transform.position[0] + centerOffsetX;
    const centerZ = transform.position[2] + centerOffsetZ;
    const halfWidth = segment.width / 2;
    const halfLength = sliceLength / 2;
    const corners = [
        [-halfWidth, -halfLength],
        [halfWidth, -halfLength],
        [halfWidth, halfLength],
        [-halfWidth, halfLength],
    ];
    return corners.map(([localWidth, localLength]) => {
        const [offsetX, offsetZ] = rotateXZ(localWidth, localLength, transform.rotation);
        return [centerX + offsetX, centerZ + offsetZ];
    });
}
function getStraightSegmentSlicePolygon(stair, layout, startAlong, endAlong) {
    return getStraightSegmentLocalSlicePolygon(layout, startAlong, endAlong).map(([x, z]) => toWorldPlanPoint(stair, x, z));
}
function getStraightFlightOpeningDepth(stair, segment) {
    const treadDepth = Math.max(0.2, segment.length / Math.max(segment.stepCount || stair.stepCount || 10, 1));
    return Math.min(segment.length, Math.max(treadDepth * 10, segment.length * 0.8, 3.0));
}
function polygonArea(points) {
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        if (!(current && next))
            continue;
        area += current[0] * next[1] - next[0] * current[1];
    }
    return area / 2;
}
function isCoveredByExistingHole(existingHoles, autoHole) {
    return existingHoles.some((existingHole) => polygonContainsPolygon(existingHole, autoHole));
}
function getAxisAlignedRectFromPolygon(polygon) {
    if (polygon.length < 4)
        return null;
    const xs = polygon.map(([x]) => x);
    const zs = polygon.map(([, z]) => z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    if (!(maxX > minX && maxZ > minZ))
        return null;
    return { minX, maxX, minZ, maxZ };
}
function expandRect(rect, offset) {
    if (offset <= 1e-6) {
        return rect;
    }
    return {
        minX: rect.minX - offset,
        maxX: rect.maxX + offset,
        minZ: rect.minZ - offset,
        maxZ: rect.maxZ + offset,
    };
}
function buildUnionPolygonsFromRects(rects) {
    if (rects.length === 0)
        return [];
    const xs = Array.from(new Set(rects.flatMap((rect) => [rect.minX, rect.maxX]).map((value) => Number(value.toFixed(6))))).sort((a, b) => a - b);
    const zs = Array.from(new Set(rects.flatMap((rect) => [rect.minZ, rect.maxZ]).map((value) => Number(value.toFixed(6))))).sort((a, b) => a - b);
    if (xs.length < 2 || zs.length < 2)
        return [];
    const occupied = new Set();
    for (let xi = 0; xi < xs.length - 1; xi += 1) {
        for (let zi = 0; zi < zs.length - 1; zi += 1) {
            const cx = (xs[xi] + xs[xi + 1]) / 2;
            const cz = (zs[zi] + zs[zi + 1]) / 2;
            if (rects.some((rect) => cx > rect.minX && cx < rect.maxX && cz > rect.minZ && cz < rect.maxZ)) {
                occupied.add(`${xi}:${zi}`);
            }
        }
    }
    const edgeMap = new Map();
    const addEdge = (start, end) => {
        edgeMap.set(`${start[0]},${start[1]}`, end);
    };
    for (let xi = 0; xi < xs.length - 1; xi += 1) {
        for (let zi = 0; zi < zs.length - 1; zi += 1) {
            if (!occupied.has(`${xi}:${zi}`))
                continue;
            const x0 = xs[xi];
            const x1 = xs[xi + 1];
            const z0 = zs[zi];
            const z1 = zs[zi + 1];
            if (!occupied.has(`${xi}:${zi - 1}`))
                addEdge([x0, z0], [x1, z0]);
            if (!occupied.has(`${xi + 1}:${zi}`))
                addEdge([x1, z0], [x1, z1]);
            if (!occupied.has(`${xi}:${zi + 1}`))
                addEdge([x1, z1], [x0, z1]);
            if (!occupied.has(`${xi - 1}:${zi}`))
                addEdge([x0, z1], [x0, z0]);
        }
    }
    const polygons = [];
    while (edgeMap.size > 0) {
        const firstEntry = edgeMap.entries().next().value;
        if (!firstEntry)
            break;
        const [startKey] = firstEntry;
        const startParts = startKey.split(',').map(Number);
        const sx = startParts[0];
        const sz = startParts[1];
        if (sx === undefined || sz === undefined) {
            edgeMap.delete(startKey);
            continue;
        }
        const start = [sx, sz];
        const polygon = [start];
        let current = start;
        while (true) {
            const currentKey = `${current[0]},${current[1]}`;
            const next = edgeMap.get(currentKey);
            if (!next)
                break;
            edgeMap.delete(currentKey);
            if (pointsEqual(next, start)) {
                break;
            }
            polygon.push(next);
            current = next;
        }
        if (polygon.length >= 3) {
            polygons.push(polygonArea(polygon) < 0 ? [...polygon].reverse() : polygon);
        }
    }
    return polygons;
}
function getCurvedOpeningPolygon(stair, offset = 0) {
    const width = Math.max(stair.width ?? 1, 0.4);
    const innerRadius = Math.max(0.01, (stair.innerRadius ?? 0.9) - offset);
    const outerRadius = (stair.innerRadius ?? 0.9) + width + offset;
    const totalSweep = stair.sweepAngle ?? Math.PI / 2;
    const baseOpeningSweep = Math.abs(totalSweep) *
        Math.max(CURVED_STAIR_SLAB_OPENING_RATIO, 1 / Math.max(stair.stepCount ?? 1, 1));
    const angleOffset = offset / Math.max(innerRadius, 0.1);
    const openingSweep = Math.sign(totalSweep || 1) * Math.min(Math.abs(totalSweep), baseOpeningSweep + angleOffset * 2);
    const startAngle = totalSweep / 2 - openingSweep;
    const endAngle = totalSweep / 2;
    const segmentCount = Math.max(10, Math.min(32, Math.ceil(Math.abs(openingSweep) / (Math.PI / 24) + Math.max(stair.stepCount ?? 1, 1) * 0.5)));
    const outerPoints = [];
    const innerPoints = [];
    for (let index = 0; index <= segmentCount; index++) {
        const t = index / segmentCount;
        const angle = startAngle + (endAngle - startAngle) * t;
        outerPoints.push(toWorldPlanPoint(stair, Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius));
    }
    for (let index = segmentCount; index >= 0; index--) {
        const t = index / segmentCount;
        const angle = startAngle + (endAngle - startAngle) * t;
        innerPoints.push(toWorldPlanPoint(stair, Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius));
    }
    return [...outerPoints, ...innerPoints];
}
function getSpiralOpeningPolygon(stair, offset = 0) {
    const radius = Math.max(0.05, stair.innerRadius ?? 0.9) + Math.max(stair.width ?? 1, 0.4) + offset;
    const segmentCount = 48;
    return Array.from({ length: segmentCount }).map((_, index) => {
        const angle = (index / segmentCount) * Math.PI * 2;
        return toWorldPlanPoint(stair, Math.cos(angle) * radius, Math.sin(angle) * radius);
    });
}
function getSpiralLandingPolygon(stair, offset = 0) {
    const width = Math.max(stair.width ?? 1, 0.4);
    const outerRadius = Math.max(0.05, (stair.innerRadius ?? 0.9) + width);
    const depth = Math.max(stair.topLandingDepth ?? 0.9, 0.1);
    const halfWidth = width / 2;
    const localPoints = [
        [outerRadius - offset, -halfWidth - offset],
        [outerRadius + depth + offset, -halfWidth - offset],
        [outerRadius + depth + offset, halfWidth + offset],
        [outerRadius - offset, halfWidth + offset],
    ];
    return localPoints.map(([x, z]) => toWorldPlanPoint(stair, x, z));
}
function getStraightOpeningPolygonsForSurface(stair, nodes, targetElevation, openingOffsetOverride) {
    const layouts = getStraightStairLayouts(stair, nodes);
    if (layouts.length === 0)
        return [];
    const riserHeight = (stair.totalRise ?? 2.5) / Math.max(stair.stepCount ?? 10, 1);
    const targetThreshold = Math.max(riserHeight * 2, STRAIGHT_STAIR_TARGET_THRESHOLD_MIN);
    const openingOffset = Math.max(openingOffsetOverride ?? stair.openingOffset ?? 0, 0);
    const openingRects = [];
    for (let index = 0; index < layouts.length; index += 1) {
        const layout = layouts[index];
        if (!layout)
            continue;
        const { segment, transform } = layout;
        const segmentStartElevation = transform.position[1];
        const segmentTopElevation = layout.topElevation;
        if (segment.segmentType === 'stair') {
            if (Math.abs(targetElevation - segmentTopElevation) <= targetThreshold) {
                const openingDepth = getStraightFlightOpeningDepth(stair, segment);
                const flightRect = getAxisAlignedRectFromPolygon(getStraightSegmentLocalSlicePolygon(layout, Math.max(0, segment.length - openingDepth), segment.length));
                if (flightRect)
                    openingRects.push(expandRect(flightRect, openingOffset));
            }
            continue;
        }
        if (Math.abs(targetElevation - segmentStartElevation) > targetThreshold) {
            continue;
        }
        const landingRects = [];
        const landingRect = getAxisAlignedRectFromPolygon(getStraightSegmentLocalSlicePolygon(layout, 0, layout.segment.length));
        if (landingRect)
            landingRects.push(expandRect(landingRect, openingOffset));
        const previous = layouts[index - 1];
        if (previous?.segment.segmentType === 'stair') {
            const previousTopElevation = previous.topElevation;
            if (Math.abs(targetElevation - previousTopElevation) <= targetThreshold) {
                const previousDepth = getStraightFlightOpeningDepth(stair, previous.segment);
                const previousRect = getAxisAlignedRectFromPolygon(getStraightSegmentLocalSlicePolygon(previous, Math.max(0, previous.segment.length - previousDepth), previous.segment.length));
                if (previousRect)
                    landingRects.push(expandRect(previousRect, openingOffset));
            }
        }
        openingRects.push(...landingRects);
    }
    if (openingRects.length > 0) {
        const unionPolygons = buildUnionPolygonsFromRects(openingRects).map((polygon) => polygon.map(([x, z]) => toWorldPlanPoint(stair, x, z)));
        if (unionPolygons.length > 0) {
            return unionPolygons;
        }
    }
    let fallbackLayout = layouts[layouts.length - 1];
    for (let index = layouts.length - 1; index >= 0; index -= 1) {
        const layout = layouts[index];
        if (layout?.segment.segmentType === 'stair') {
            fallbackLayout = layout;
            break;
        }
    }
    return fallbackLayout ? [getStraightSegmentFootprintPolygon(stair, fallbackLayout)] : [];
}
function getStairOpeningPolygons(stair, nodes, targetElevation, openingOffsetOverride) {
    if ((stair.slabOpeningMode ?? 'none') !== 'destination') {
        return [];
    }
    const openingOffset = Math.max(openingOffsetOverride ?? stair.openingOffset ?? 0, 0);
    if (stair.stairType === 'curved') {
        return [
            getCurvedOpeningPolygon(stair, Math.max(openingOffset - STAIR_SLAB_OPENING_TIGHTENING, 0)),
        ];
    }
    if (stair.stairType === 'spiral') {
        const offset = Math.max(openingOffset - STAIR_SLAB_OPENING_TIGHTENING, 0);
        const polygons = [getSpiralOpeningPolygon(stair, offset)];
        if (stair.topLandingMode === 'integrated') {
            polygons.push(getSpiralLandingPolygon(stair, offset));
        }
        return polygons;
    }
    if (typeof targetElevation === 'number') {
        return getStraightOpeningPolygonsForSurface(stair, nodes, targetElevation, openingOffset);
    }
    return getStraightOpeningPolygonsForSurface(stair, nodes, Math.max(...getStraightStairLayouts(stair, nodes).map((layout) => layout.topElevation), 0), openingOffset);
}
function getApplicableStairOpeningPolygons(stair, nodes, targetElevation, surfacePolygon) {
    const configuredOffset = Math.max(stair.openingOffset ?? 0, 0);
    const polygons = getStairOpeningPolygons(stair, nodes, targetElevation, configuredOffset);
    const overlappingPolygons = polygons.filter((polygon) => polygonsOverlap(surfacePolygon, polygon));
    if (overlappingPolygons.length === polygons.length || configuredOffset <= 1e-6) {
        return overlappingPolygons;
    }
    const fallbackPolygons = getStairOpeningPolygons(stair, nodes, targetElevation, 0);
    const overlappingFallbackPolygons = fallbackPolygons.filter((polygon) => polygonsOverlap(surfacePolygon, polygon));
    return overlappingFallbackPolygons.length === fallbackPolygons.length
        ? overlappingFallbackPolygons
        : overlappingPolygons;
}
function getTargetSlabElevationForStair(stair, slab, slabLevelId, nodes) {
    const { fromLevelId } = getResolvedStairLevelIds(stair, nodes);
    const fromLevel = getLevelNumber(fromLevelId, nodes);
    const slabLevel = getLevelNumber(slabLevelId, nodes);
    if (fromLevel === undefined || slabLevel === undefined) {
        return slab.elevation ?? 0.05;
    }
    return ((slabLevel - fromLevel) * DEFAULT_WALL_HEIGHT +
        (slab.elevation ?? 0.05) -
        (stair.position[1] ?? 0));
}
function getTargetCeilingElevationForStair(stair, ceiling, ceilingLevelId, nodes) {
    const { fromLevelId } = getResolvedStairLevelIds(stair, nodes);
    const fromLevel = getLevelNumber(fromLevelId, nodes);
    const ceilingLevel = getLevelNumber(ceilingLevelId, nodes);
    if (fromLevel === undefined || ceilingLevel === undefined) {
        return ceiling.height ?? DEFAULT_WALL_HEIGHT;
    }
    return ((ceilingLevel - fromLevel) * DEFAULT_WALL_HEIGHT +
        (ceiling.height ?? DEFAULT_WALL_HEIGHT) -
        (stair.position[1] ?? 0));
}
function shouldApplyStairToSlab(stair, slabLevelId, nodes) {
    const { fromLevelId, toLevelId } = getResolvedStairLevelIds(stair, nodes);
    const fromLevel = getLevelNumber(fromLevelId, nodes);
    const toLevel = getLevelNumber(toLevelId, nodes);
    const slabLevel = getLevelNumber(slabLevelId, nodes);
    if (!isInStairBuildingScope(stair, slabLevelId, nodes))
        return false;
    if (slabLevel === undefined) {
        return toLevelId === slabLevelId;
    }
    if (fromLevel === undefined || toLevel === undefined) {
        return toLevelId === slabLevelId;
    }
    const minLevel = Math.min(fromLevel, toLevel);
    const maxLevel = Math.max(fromLevel, toLevel);
    return slabLevel > minLevel && slabLevel <= maxLevel;
}
function shouldApplyStairToCeiling(stair, ceilingLevelId, nodes) {
    const { fromLevelId, toLevelId } = getResolvedStairLevelIds(stair, nodes);
    const fromLevel = getLevelNumber(fromLevelId, nodes);
    const toLevel = getLevelNumber(toLevelId, nodes);
    const ceilingLevel = getLevelNumber(ceilingLevelId, nodes);
    if (!isInStairBuildingScope(stair, ceilingLevelId, nodes))
        return false;
    if (ceilingLevel === undefined) {
        return fromLevelId === ceilingLevelId;
    }
    if (fromLevel === undefined || toLevel === undefined) {
        return fromLevelId === ceilingLevelId;
    }
    const minLevel = Math.min(fromLevel, toLevel);
    const maxLevel = Math.max(fromLevel, toLevel);
    return ceilingLevel >= minLevel && ceilingLevel < maxLevel;
}
export function syncAutoStairOpenings(nodes) {
    const stairs = Object.values(nodes).filter((node) => node.type === 'stair' && node.visible !== false);
    const slabs = Object.values(nodes).filter((node) => node.type === 'slab');
    const ceilings = Object.values(nodes).filter((node) => node.type === 'ceiling');
    const updates = [];
    for (const slab of slabs) {
        const slabLevelId = resolveLevelId(slab, nodes);
        const existingHoles = slab.holes ?? [];
        const existingMetadata = normalizeExistingMetadata(existingHoles, slab.holeMetadata);
        const preservedHoles = existingHoles
            .map((polygon, index) => ({ metadata: existingMetadata[index], polygon }))
            .filter((entry) => entry.metadata.source !== 'stair');
        const preservedHolePolygons = preservedHoles.map((entry) => entry.polygon);
        const stairHoles = stairs
            .filter((stair) => shouldApplyStairToSlab(stair, slabLevelId, nodes))
            .flatMap((stair) => getApplicableStairOpeningPolygons(stair, nodes, getTargetSlabElevationForStair(stair, slab, slabLevelId, nodes), slab.polygon).map((polygon) => ({
            polygon,
            metadata: {
                source: 'stair',
                stairId: stair.id,
            },
        })))
            .filter((hole) => !isCoveredByExistingHole(preservedHolePolygons, hole.polygon));
        const nextHoles = [
            ...preservedHoles.map((hole) => hole.polygon),
            ...stairHoles.map((hole) => hole.polygon),
        ];
        const nextMetadata = [
            ...preservedHoles.map((hole) => ({ ...hole.metadata })),
            ...stairHoles.map((hole) => hole.metadata),
        ];
        if (!(polygonsEqual(existingHoles, nextHoles) && metadataEqual(existingMetadata, nextMetadata))) {
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
            .filter((entry) => entry.metadata.source !== 'stair');
        const preservedHolePolygons = preservedHoles.map((entry) => entry.polygon);
        const stairHoles = stairs
            .filter((stair) => shouldApplyStairToCeiling(stair, ceilingLevelId, nodes))
            .flatMap((stair) => getApplicableStairOpeningPolygons(stair, nodes, getTargetCeilingElevationForStair(stair, ceiling, ceilingLevelId, nodes), ceiling.polygon).map((polygon) => ({
            polygon,
            metadata: {
                source: 'stair',
                stairId: stair.id,
            },
        })))
            .filter((hole) => !isCoveredByExistingHole(preservedHolePolygons, hole.polygon));
        const nextHoles = [
            ...preservedHoles.map((hole) => hole.polygon),
            ...stairHoles.map((hole) => hole.polygon),
        ];
        const nextMetadata = [
            ...preservedHoles.map((hole) => ({ ...hole.metadata })),
            ...stairHoles.map((hole) => hole.metadata),
        ];
        if (!(polygonsEqual(existingHoles, nextHoles) && metadataEqual(existingMetadata, nextMetadata))) {
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
