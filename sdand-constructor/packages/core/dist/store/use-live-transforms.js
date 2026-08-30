// Ephemeral live transform state for nodes being actively dragged/moved.
// This decouples 2D (floorplan) and 3D (viewer) so neither needs to peek
// into the other's scene graph during drag operations.
import { create } from 'zustand';
const useLiveTransforms = create((set, get) => ({
    transforms: new Map(),
    set: (nodeId, transform) => set((state) => {
        const next = new Map(state.transforms);
        next.set(nodeId, transform);
        return { transforms: next };
    }),
    get: (nodeId) => get().transforms.get(nodeId),
    clear: (nodeId) => set((state) => {
        const next = new Map(state.transforms);
        next.delete(nodeId);
        return { transforms: next };
    }),
    clearAll: () => set({ transforms: new Map() }),
}));
export default useLiveTransforms;
