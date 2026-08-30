import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { NodeIdSchema } from './schemas';
export const describeNodeInput = {
    id: NodeIdSchema,
};
export const describeNodeOutput = {
    id: z.string(),
    type: z.string(),
    parentId: z.string().nullable(),
    ancestryIds: z.array(z.string()),
    childrenIds: z.array(z.string()),
    properties: z.record(z.string(), z.unknown()),
    description: z.string(),
};
/**
 * Build a short, human-readable one-liner describing the node.
 * Covers the common shapes; falls back to a generic sentence otherwise.
 */
function describe(node) {
    switch (node.type) {
        case 'wall': {
            const [x1, z1] = node.start;
            const [x2, z2] = node.end;
            const t = node.thickness ?? 0.1;
            const h = node.height ?? 2.5;
            return `Wall from (${x1},${z1}) to (${x2},${z2}), thickness ${t.toFixed(2)}m, height ${h.toFixed(2)}m`;
        }
        case 'level':
            return `Level ${node.level}`;
        case 'building': {
            const [x, y, z] = node.position;
            return `Building at (${x},${y},${z})`;
        }
        case 'site':
            return `Site with ${node.polygon?.points.length ?? 0}-sided property line`;
        case 'zone':
            return `Zone "${node.name}" with ${node.polygon.length} vertices`;
        case 'slab':
            return `Slab with ${node.polygon.length} vertices`;
        case 'ceiling':
            return `Ceiling with ${node.polygon.length} vertices, height ${node.height.toFixed(2)}m`;
        case 'door':
            return `Door (${node.width.toFixed(2)}m x ${node.height.toFixed(2)}m)`;
        case 'window':
            return `Window (${node.width.toFixed(2)}m x ${node.height.toFixed(2)}m)`;
        case 'item': {
            const [x, y, z] = node.position;
            return `Item "${node.asset.name}" at (${x},${y},${z})`;
        }
        default:
            return `${node.type} node`;
    }
}
export function registerDescribeNode(server, bridge) {
    server.registerTool('describe_node', {
        title: 'Describe node',
        description: 'Return a structured summary of a node including its ancestry, children IDs, key properties, and a short human description.',
        inputSchema: describeNodeInput,
        outputSchema: describeNodeOutput,
    }, async ({ id }) => {
        const node = bridge.getNode(id);
        if (!node) {
            throwMcpError(ErrorCode.InvalidParams, `Node not found: ${id}`);
        }
        // Ancestry minus self.
        const ancestry = bridge.getAncestry(id);
        const ancestryIds = ancestry.slice(1).map((n) => n.id);
        const children = bridge.getChildren(id);
        const childrenIds = children.map((n) => n.id);
        const n = node;
        const payload = {
            id: n.id,
            type: n.type,
            parentId: (n.parentId ?? null),
            ancestryIds,
            childrenIds,
            properties: n,
            description: describe(n),
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
