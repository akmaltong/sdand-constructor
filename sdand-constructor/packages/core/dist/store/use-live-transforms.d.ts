export type LiveTransform = {
    position: [number, number, number];
    rotation: number;
};
type LiveTransformState = {
    transforms: Map<string, LiveTransform>;
    set(nodeId: string, transform: LiveTransform): void;
    get(nodeId: string): LiveTransform | undefined;
    clear(nodeId: string): void;
    clearAll(): void;
};
declare const useLiveTransforms: import("zustand").UseBoundStore<import("zustand").StoreApi<LiveTransformState>>;
export default useLiveTransforms;
//# sourceMappingURL=use-live-transforms.d.ts.map