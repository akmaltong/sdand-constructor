'use client';
import { useEffect, useRef } from 'react';
import useScene from '../../store/use-scene';
import { syncAutoElevatorOpenings } from './elevator-opening-sync';
function isOpeningRelevantNode(node) {
    return (node?.type === 'building' ||
        node?.type === 'ceiling' ||
        node?.type === 'elevator' ||
        node?.type === 'level' ||
        node?.type === 'slab');
}
function hasOpeningRelevantNodeChange(nextNodes, prevNodes) {
    if (nextNodes === prevNodes)
        return false;
    const ids = new Set([...Object.keys(nextNodes), ...Object.keys(prevNodes)]);
    for (const id of ids) {
        const nextNode = nextNodes[id];
        const prevNode = prevNodes[id];
        if (nextNode === prevNode)
            continue;
        if (isOpeningRelevantNode(nextNode) || isOpeningRelevantNode(prevNode))
            return true;
    }
    return false;
}
export const ElevatorOpeningSystem = () => {
    const syncingAutoOpeningsRef = useRef(false);
    useEffect(() => {
        const applyUpdates = (updates) => {
            if (updates.length === 0)
                return;
            syncingAutoOpeningsRef.current = true;
            useScene.getState().updateNodes(updates);
            queueMicrotask(() => {
                syncingAutoOpeningsRef.current = false;
            });
        };
        applyUpdates(syncAutoElevatorOpenings(useScene.getState().nodes));
        return useScene.subscribe((state, prevState) => {
            if (syncingAutoOpeningsRef.current)
                return;
            if (!hasOpeningRelevantNodeChange(state.nodes, prevState.nodes))
                return;
            applyUpdates(syncAutoElevatorOpenings(state.nodes));
        });
    }, []);
    return null;
};
