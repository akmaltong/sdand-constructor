import { type AnyNode, type AnyNodeId } from '../../schema';
import type { SceneState } from '../use-scene';
type NodeCreateOp = {
    node: AnyNode;
    parentId?: AnyNodeId;
};
type NodeUpdateOp = {
    id: AnyNodeId;
    data: Partial<AnyNode>;
};
type NodeDeleteOp = AnyNodeId;
export declare const createNodesAction: (set: (fn: (state: SceneState) => Partial<SceneState>) => void, get: () => SceneState, ops: NodeCreateOp[]) => void;
export declare const applyNodeChangesAction: (set: (fn: (state: SceneState) => Partial<SceneState>) => void, get: () => SceneState, changes: {
    create?: NodeCreateOp[];
    update?: NodeUpdateOp[];
    delete?: NodeDeleteOp[];
}) => void;
export declare const updateNodesAction: (set: (fn: (state: SceneState) => Partial<SceneState>) => void, get: () => SceneState, updates: {
    id: AnyNodeId;
    data: Partial<AnyNode>;
}[]) => void;
export declare const deleteNodesAction: (set: (fn: (state: SceneState) => Partial<SceneState>) => void, get: () => SceneState, ids: AnyNodeId[]) => void;
export {};
//# sourceMappingURL=node-actions.d.ts.map