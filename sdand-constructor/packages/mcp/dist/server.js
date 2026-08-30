import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createSceneOperations } from './operations';
import { registerPrompts } from './prompts';
import { registerResources } from './resources';
import { registerTools } from './tools';
import { registerVisionTools } from './tools/vision';
export function createPascalMcpServer(opts) {
    const server = new McpServer({
        name: opts.name ?? 'pascal-mcp',
        version: opts.version ?? '0.1.0',
    });
    const operations = opts.operations ?? createSceneOperations({ bridge: opts.bridge, store: opts.store });
    registerTools(server, operations);
    registerVisionTools(server, operations);
    registerResources(server, operations);
    registerPrompts(server, operations);
    return server;
}
