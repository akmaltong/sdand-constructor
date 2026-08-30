import { resolveElevatorServiceLevels } from './elevator-service';
function getRuntimeLevelId(runtime, elevator) {
    return runtime?.currentLevelId ?? elevator.defaultLevelId ?? elevator.fromLevelId ?? null;
}
function scoreDispatchCandidate({ elevator, elevators, levelId, nodes, }) {
    if ((elevator.disabledLevelIds ?? []).includes(levelId))
        return null;
    if ((elevator.serviceOnlyLevelIds ?? []).includes(levelId))
        return null;
    const serviceLevels = resolveElevatorServiceLevels(elevator, nodes);
    const targetIndex = serviceLevels.findIndex((level) => level.id === levelId);
    if (targetIndex < 0)
        return null;
    const runtime = elevators[elevator.id];
    const runtimeLevelId = getRuntimeLevelId(runtime, elevator);
    const currentIndex = runtimeLevelId
        ? serviceLevels.findIndex((level) => level.id === runtimeLevelId)
        : -1;
    const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const distance = Math.abs(targetIndex - resolvedCurrentIndex);
    const queuePenalty = (runtime?.queue.length ?? 0) * 2 + (runtime?.targetLevelId ? 1 : 0);
    const motionPenalty = runtime?.phase === 'moving' || runtime?.phase === 'closing' ? 0.5 : 0;
    const openPenalty = runtime?.phase === 'open' || runtime?.phase === 'opening' ? 0.2 : 0;
    return distance + queuePenalty + motionPenalty + openPenalty;
}
export function resolveElevatorDispatchTarget({ elevators, levelId, nodes, requestedElevatorId, }) {
    const requestedElevator = nodes[requestedElevatorId];
    if (!(requestedElevator?.type === 'elevator' && requestedElevator.parentId)) {
        return requestedElevatorId;
    }
    const building = nodes[requestedElevator.parentId];
    if (building?.type !== 'building') {
        return requestedElevatorId;
    }
    let bestElevatorId = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const childId of building.children) {
        const candidate = nodes[childId];
        if (!(candidate?.type === 'elevator' && candidate.visible !== false))
            continue;
        const score = scoreDispatchCandidate({
            elevator: candidate,
            elevators,
            levelId,
            nodes,
        });
        if (score === null)
            continue;
        const tieBreaker = candidate.id === requestedElevatorId ? -0.01 : 0;
        const finalScore = score + tieBreaker;
        if (finalScore < bestScore) {
            bestScore = finalScore;
            bestElevatorId = candidate.id;
        }
    }
    return bestElevatorId ?? requestedElevatorId;
}
