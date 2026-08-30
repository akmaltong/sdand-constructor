import { CORNER_EPSILON_SQ, gutterEndpointsInFrame, planDistSq } from './corner-mitre';
import { computeEaveY } from './eave-snap';
function guttersMeet(a, aSeg, b, bSeg) {
    const ea = gutterEndpointsInFrame(a, aSeg);
    const eb = gutterEndpointsInFrame(b, bSeg);
    return (planDistSq(ea.minus.pos, eb.plus.pos) <= CORNER_EPSILON_SQ ||
        planDistSq(ea.minus.pos, eb.minus.pos) <= CORNER_EPSILON_SQ ||
        planDistSq(ea.plus.pos, eb.plus.pos) <= CORNER_EPSILON_SQ ||
        planDistSq(ea.plus.pos, eb.minus.pos) <= CORNER_EPSILON_SQ);
}
// Each gutter mounts at `segment.position[1] + computeEaveY(segment)` in
// the roof frame (the renderer adds the segment-local eave Y under the
// segment's group). Segments can sit at different Y offsets, so the run
// has to be compared — and the answer returned — in the SHARED roof
// frame, not raw segment-local eave Ys.
function worldEaveY(segment) {
    return (segment.position?.[1] ?? 0) + computeEaveY(segment);
}
export function computeSharedEaveY(subject, subjectSegment, siblings) {
    const subjectBaseY = subjectSegment.position?.[1] ?? 0;
    if (siblings.length === 0)
        return computeEaveY(subjectSegment);
    // Index 0 is the subject; the rest are candidates. BFS the corner
    // graph from the subject and keep the tallest eave in its component.
    const nodes = [{ gutter: subject, segment: subjectSegment }, ...siblings];
    const visited = new Array(nodes.length).fill(false);
    visited[0] = true;
    const queue = [0];
    let maxWorldEaveY = worldEaveY(subjectSegment);
    while (queue.length > 0) {
        const i = queue.pop();
        const cur = nodes[i];
        for (let j = 0; j < nodes.length; j++) {
            if (visited[j])
                continue;
            const other = nodes[j];
            if (guttersMeet(cur.gutter, cur.segment, other.gutter, other.segment)) {
                visited[j] = true;
                queue.push(j);
                const eaveY = worldEaveY(other.segment);
                if (eaveY > maxWorldEaveY)
                    maxWorldEaveY = eaveY;
            }
        }
    }
    // Back to the SUBJECT's segment-local frame — the renderer applies the
    // returned value under the subject segment's group, which already adds
    // `subjectBaseY`.
    return maxWorldEaveY - subjectBaseY;
}
