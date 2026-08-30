const DEFAULT_ELEVATOR_SHAFT_WALL_THICKNESS = 0.09;
export function getResolvedElevatorDoorStyle(doorStyle) {
    return doorStyle ?? 'center-opening';
}
export function getResolvedElevatorDoorPanelStyle(doorPanelStyle) {
    return doorPanelStyle ?? 'glass-frame';
}
export function getResolvedElevatorShaftStyle(shaftStyle) {
    return shaftStyle ?? 'solid';
}
export function getElevatorDoorLeafSides(doorStyle) {
    const resolvedDoorStyle = getResolvedElevatorDoorStyle(doorStyle);
    if (resolvedDoorStyle === 'single-left')
        return ['left'];
    if (resolvedDoorStyle === 'single-right')
        return ['right'];
    return ['left', 'right'];
}
export function getElevatorDoorLeafX(side, openingWidth, doorOpen, doorStyle) {
    const resolvedDoorStyle = getResolvedElevatorDoorStyle(doorStyle);
    if (resolvedDoorStyle === 'center-opening') {
        const direction = side === 'left' ? -1 : 1;
        return direction * (openingWidth / 4 + doorOpen * openingWidth * 0.34);
    }
    const direction = resolvedDoorStyle === 'single-left' ? -1 : 1;
    return direction * doorOpen * openingWidth * 0.68;
}
export function getElevatorDoorLeafWidth(openingWidth, doorStyle) {
    return getResolvedElevatorDoorStyle(doorStyle) === 'center-opening'
        ? Math.max(openingWidth / 2 - 0.018, 0.12)
        : Math.max(openingWidth - 0.018, 0.18);
}
export function getElevatorCabWidth(node) {
    return Math.max(node.width, 0.8);
}
export function getElevatorCabDepth(node) {
    return Math.max(node.depth, 0.8);
}
export function getElevatorShaftWallThickness(node) {
    return Math.max(node.shaftWallThickness ?? DEFAULT_ELEVATOR_SHAFT_WALL_THICKNESS, 0.04);
}
export function getElevatorShaftWidth(node, cabWidth = getElevatorCabWidth(node)) {
    return Math.max(node.shaftWidth ?? cabWidth, cabWidth, 0.8);
}
export function getElevatorShaftDepth(node, cabDepth = getElevatorCabDepth(node)) {
    return Math.max(node.shaftDepth ?? cabDepth, cabDepth, 0.8);
}
export function getElevatorCabCenterZ(node) {
    return -getElevatorShaftDepth(node) / 2 + getElevatorCabDepth(node) / 2;
}
