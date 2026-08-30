import { emitter, } from '@pascal-app/core';
import useViewer from '../store/use-viewer';
export function useNodeEvents(node, type) {
    const emit = (suffix, e) => {
        const eventKey = `${type}:${suffix}`;
        const localPoint = e.object.worldToLocal(e.point.clone());
        const payload = {
            node,
            position: [e.point.x, e.point.y, e.point.z],
            localPosition: [localPoint.x, localPoint.y, localPoint.z],
            normal: e.face ? [e.face.normal.x, e.face.normal.y, e.face.normal.z] : undefined,
            faceIndex: e.faceIndex ?? undefined,
            object: e.object,
            stopPropagation: () => e.stopPropagation(),
            nativeEvent: e,
        };
        // `emitter.emit` is typed over a fixed union of `${kind}:${suffix}`
        // keys; the `as never` cast lets us emit a kind-specific payload
        // through that generic surface without enumerating every kind.
        emitter.emit(eventKey, payload);
    };
    // Suppress node pointer events while an interaction drag is in
    // progress. `cameraDragging` covers orbit/pan/dolly; `inputDragging`
    // covers host-driven drags (editor handle arrows etc.). Without
    // this, the synthesized click on pointerup would reroute selection
    // to whatever mesh the cursor lands on at release.
    const isInteractionActive = () => {
        const s = useViewer.getState();
        return s.cameraDragging || s.inputDragging;
    };
    return {
        onPointerDown: (e) => {
            if (isInteractionActive())
                return;
            if (e.button !== 0)
                return;
            emit('pointerdown', e);
        },
        onPointerUp: (e) => {
            if (isInteractionActive())
                return;
            if (e.button !== 0)
                return;
            emit('pointerup', e);
            // Synthesize a click event on pointer up to be more forgiving than R3F's default onClick
            // which often fails if the mouse moves even 1 pixel.
            emit('click', e);
        },
        onClick: (e) => {
            // Disable default R3F click since we synthesize it on pointerup
            // This prevents double-clicks from firing twice.
        },
        onPointerEnter: (e) => {
            if (isInteractionActive())
                return;
            emit('enter', e);
        },
        onPointerLeave: (e) => {
            if (isInteractionActive())
                return;
            emit('leave', e);
        },
        onPointerMove: (e) => {
            if (isInteractionActive())
                return;
            emit('move', e);
        },
        onDoubleClick: (e) => {
            if (isInteractionActive())
                return;
            emit('double-click', e);
        },
        onContextMenu: (e) => {
            if (isInteractionActive())
                return;
            emit('context-menu', e);
        },
    };
}
