type TemporalStoreLike = {
    temporal: {
        getState(): {
            pause(): void;
            resume(): void;
        };
    };
};
export declare function pauseSceneHistory(sceneStore: TemporalStoreLike): void;
export declare function resumeSceneHistory(sceneStore: TemporalStoreLike): void;
export declare function getSceneHistoryPauseDepth(): number;
export declare function resetSceneHistoryPauseDepth(): void;
export {};
//# sourceMappingURL=history-control.d.ts.map