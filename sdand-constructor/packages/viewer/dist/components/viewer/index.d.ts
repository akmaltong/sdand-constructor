import { type AnyNodeId } from '@pascal-app/core';
import { type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import type { ColorPreset, RenderShading } from '../../lib/materials';
import { type RenderContext } from '../../store/use-viewer';
import { type HoverStyles } from './post-processing';
declare module '@react-three/fiber' {
    interface ThreeElements extends ThreeToJSXElements<typeof THREE> {
    }
}
interface ViewerProps {
    children?: React.ReactNode;
    hoverStyles?: HoverStyles;
    selectionManager?: 'default' | 'custom';
    perf?: boolean;
    useBvh?: boolean;
    renderContext?: RenderContext;
    defaultRender?: {
        shading?: RenderShading;
        textures?: boolean;
        colorPreset?: ColorPreset;
    };
    /**
     * Visibility filter on the live canvas. When non-null, every registered
     * node group whose id is not in `isolate` (or in the isolated set's
     * ancestor / descendant closure) is hidden. Pass `null` (or omit) to
     * clear. Powers the unified preset-capture flow (community modal sets
     * this to the subtree it wants to thumbnail) and is the building block
     * for a future focus-mode UX.
     */
    isolate?: AnyNodeId[] | null;
    /**
     * Host-controlled key for scene readiness. Change it whenever a new scene
     * graph is being loaded; the viewer will report not-ready until the graph is
     * mounted, build systems have had a frame to settle, and one rendered frame
     * has presented the new content.
     */
    sceneReadyKey?: string | number | null;
    onSceneReadyChange?: (ready: boolean) => void;
}
/** Imperative handle exposed via `ref` on `<Viewer>`. */
export type ViewerHandle = {
    /**
     * Apply / clear the same visibility filter as the `isolate` prop. Useful
     * for transient cases (a temporary hover-to-isolate UX) where holding
     * the value in React state would be over-engineering. Passing `null`
     * clears.
     */
    setIsolated(ids: AnyNodeId[] | null): void;
};
declare const Viewer: import("react").ForwardRefExoticComponent<ViewerProps & import("react").RefAttributes<ViewerHandle>>;
export default Viewer;
//# sourceMappingURL=index.d.ts.map