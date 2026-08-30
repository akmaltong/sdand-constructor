import { WindowNode } from '@pascal-app/core';
/**
 * Move/duplicate tool for WindowNodes — wall-only, same guardrails as WindowTool.
 *
 * Move mode (metadata.isNew falsy):
 *   Adopts the existing window, pauses temporal. On commit: restores original state
 *   (clean undo baseline) then resumes + updateNode (undo reverts to original position).
 *   On cancel: restores original state.
 *
 * Duplicate mode (metadata.isNew = true):
 *   The node is a freshly created transient copy. On commit: deletes transient + resumes
 *   + createNode (undo removes the new window entirely). On cancel: deletes the node.
 */
declare const MoveWindowTool: React.FC<{
    node: WindowNode;
}>;
export default MoveWindowTool;
//# sourceMappingURL=move-tool.d.ts.map