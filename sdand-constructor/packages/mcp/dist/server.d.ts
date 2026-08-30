import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneBridge } from './bridge/scene-bridge';
import { type SceneOperations } from './operations';
import type { SceneStore } from './storage/types';
export type CreatePascalMcpServerOptions = {
    bridge: SceneBridge;
    operations?: SceneOperations;
    /** Required for persistence tools. Hosted apps and CLIs inject their own store. */
    store?: SceneStore;
    name?: string;
    version?: string;
};
export declare function createPascalMcpServer(opts: CreatePascalMcpServerOptions): McpServer;
//# sourceMappingURL=server.d.ts.map