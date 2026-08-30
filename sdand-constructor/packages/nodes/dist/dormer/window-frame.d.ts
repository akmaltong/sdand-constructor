import * as THREE from 'three';
/**
 * Frame + glass geometry for the window opening on a dormer's gable
 * face. The extruded frame profile uses the same shape builders as the
 * CSG cut in the viewer (`generateDormerGeometry`), so the frame sits
 * flush in the wall — keeping the cut and the frame visually in sync.
 *
 * Only the frame bars and glass panes are produced here; the wall
 * opening itself is CSG-subtracted from the dormer body inside the
 * viewer's `generateDormerGeometry`.
 */
export type DormerWindowShape = 'rectangle' | 'rounded' | 'arch';
export type WindowGeometries = {
    frameBars: {
        geo: THREE.BufferGeometry;
        pos: [number, number, number];
    }[];
    glassPanes: {
        geo: THREE.BufferGeometry;
        pos: [number, number, number];
    }[];
};
export declare function buildDormerWindowGeometries(winW: number, winH: number, ft: number, fd: number, cols: number, rows: number, dt: number, shape?: DormerWindowShape, archHeight?: number, cornerRadii?: [number, number, number, number]): WindowGeometries;
//# sourceMappingURL=window-frame.d.ts.map