export const SECTIONAL_GARAGE_RENDER_OPEN_SCALE = 0.88;
export function clampDoorOperationState(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}
export function isOperationDoorType(doorType) {
    return (doorType === 'folding' ||
        doorType === 'pocket' ||
        doorType === 'barn' ||
        doorType === 'sliding' ||
        doorType === 'garage-sectional' ||
        doorType === 'garage-rollup' ||
        doorType === 'garage-tiltup');
}
export function getDoorRenderOpenAmount(doorType, operationState) {
    const openAmount = clampDoorOperationState(operationState);
    return doorType === 'garage-sectional'
        ? openAmount * SECTIONAL_GARAGE_RENDER_OPEN_SCALE
        : openAmount;
}
export function getGarageVisibleOpeningRatio(doorType, operationState) {
    if (doorType === 'garage-sectional') {
        return Math.min(1, clampDoorOperationState(operationState) / SECTIONAL_GARAGE_RENDER_OPEN_SCALE);
    }
    return clampDoorOperationState(operationState);
}
