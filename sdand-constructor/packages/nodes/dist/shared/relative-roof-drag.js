import { sceneRegistry, } from '@pascal-app/core';
import { useViewer } from '@pascal-app/viewer';
import * as THREE from 'three';
import { resolveRoofSegmentHit } from './roof-segment-hit';
import { getSurfaceY } from './roof-surface';
export function roofSegmentLocalToBuildingLocal(segmentId, position) {
    const segmentObj = sceneRegistry.nodes.get(segmentId);
    if (!segmentObj)
        return position;
    const point = segmentObj.localToWorld(new THREE.Vector3(...position));
    const buildingId = useViewer.getState().selection.buildingId;
    const buildingObj = buildingId ? sceneRegistry.nodes.get(buildingId) : null;
    if (buildingObj)
        buildingObj.worldToLocal(point);
    return [point.x, point.y, point.z];
}
export function createRelativeRoofDrag(original) {
    let state = null;
    const getPositionInSegment = (position, fromSegmentId, segment) => {
        if (fromSegmentId === segment.id)
            return position;
        const fromSegmentObj = fromSegmentId
            ? sceneRegistry.nodes.get(fromSegmentId)
            : null;
        const targetSegmentObj = sceneRegistry.nodes.get(segment.id);
        if (!(fromSegmentObj && targetSegmentObj))
            return position;
        const point = fromSegmentObj.localToWorld(new THREE.Vector3(...position));
        targetSegmentObj.worldToLocal(point);
        return [point.x, point.y, point.z];
    };
    const getStartPositionForSegment = (segment, previousState) => {
        if (previousState) {
            return getPositionInSegment(previousState.current, previousState.segmentId, segment);
        }
        if (original.roofSegmentId === segment.id)
            return original.position;
        return getPositionInSegment(original.position, original.roofSegmentId, segment);
    };
    return {
        resolve(event) {
            const hit = resolveRoofSegmentHit(event.node, event.position[0], event.position[1], event.position[2]);
            if (!hit)
                return null;
            if (!state || state.segmentId !== hit.segment.id) {
                const start = getStartPositionForSegment(hit.segment, state);
                state = {
                    segmentId: hit.segment.id,
                    anchor: [hit.localX, hit.localZ],
                    start,
                    current: start,
                    surfaceOffsetY: start[1] - getSurfaceY(start[0], start[2], hit.segment),
                };
            }
            const localX = state.start[0] + (hit.localX - state.anchor[0]);
            const localZ = state.start[2] + (hit.localZ - state.anchor[1]);
            const localY = getSurfaceY(localX, localZ, hit.segment) + state.surfaceOffsetY;
            state.current = [localX, localY, localZ];
            return {
                segment: hit.segment,
                localX,
                localY,
                localZ,
                hit,
            };
        },
    };
}
