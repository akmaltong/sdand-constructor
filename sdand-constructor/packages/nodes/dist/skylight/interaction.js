import { useInteractive, useScene, } from '@pascal-app/core';
export const SKYLIGHT_TOGGLE_ANIMATION_MS = 520;
export function isOperableSkylightType(skylightType) {
    return skylightType === 'opening' || skylightType === 'sliding';
}
export function isOperableSkylightNode(node) {
    return isOperableSkylightType(node.skylightType);
}
function getDisplayedSkylightValue(skylightId, nodeValue) {
    const interactive = useInteractive.getState();
    const runtimeValue = interactive.skylights[skylightId]?.operationState;
    if (runtimeValue !== undefined)
        return runtimeValue;
    const queuedValue = interactive.skylightAnimations[skylightId]?.from;
    if (queuedValue !== undefined)
        return queuedValue;
    return nodeValue ?? 0;
}
function startSkylightOpenAnimation(skylightId, field, from, to, options) {
    useInteractive.getState().startSkylightAnimation(skylightId, {
        field,
        from,
        to,
        startedAt: null,
        durationMs: SKYLIGHT_TOGGLE_ANIMATION_MS,
        persist: options?.persist ?? true,
    });
}
export function toggleSkylightOpenState(skylightId, options) {
    const node = useScene.getState().nodes[skylightId];
    if (node?.type !== 'skylight' || !isOperableSkylightType(node.skylightType))
        return;
    const currentOpenAmount = getDisplayedSkylightValue(skylightId, node.operationState);
    startSkylightOpenAnimation(skylightId, 'operationState', currentOpenAmount, currentOpenAmount >= 0.5 ? 0 : 1, options);
}
export function closeSkylightOpenState(skylightId, options) {
    const node = useScene.getState().nodes[skylightId];
    if (node?.type !== 'skylight' || !isOperableSkylightType(node.skylightType))
        return;
    const currentOpenAmount = getDisplayedSkylightValue(skylightId, node.operationState);
    startSkylightOpenAnimation(skylightId, 'operationState', currentOpenAmount, 0, options);
}
