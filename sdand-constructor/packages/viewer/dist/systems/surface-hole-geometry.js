import { unionPolygons } from '../lib/polygon-union';
export function mergeSurfaceHolePolygons(holes) {
    return unionPolygons(holes);
}
