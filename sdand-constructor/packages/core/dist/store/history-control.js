let sceneHistoryPauseDepth = 0;
export function pauseSceneHistory(sceneStore) {
    if (sceneHistoryPauseDepth === 0) {
        sceneStore.temporal.getState().pause();
    }
    sceneHistoryPauseDepth += 1;
}
export function resumeSceneHistory(sceneStore) {
    if (sceneHistoryPauseDepth === 0) {
        return;
    }
    sceneHistoryPauseDepth -= 1;
    if (sceneHistoryPauseDepth === 0) {
        sceneStore.temporal.getState().resume();
    }
}
export function getSceneHistoryPauseDepth() {
    return sceneHistoryPauseDepth;
}
export function resetSceneHistoryPauseDepth() {
    sceneHistoryPauseDepth = 0;
}
