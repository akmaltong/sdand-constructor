import type { SceneGraph } from '@pascal-app/core/clone-scene-graph';
export type TemplateMetadata = {
    id: string;
    name: string;
    description: string;
};
export type TemplateEntry = {
    /** Stable template id used by `create_from_template`. */
    id: string;
    name: string;
    description: string;
    /** Static SceneGraph — ids are placeholders; regenerate via `cloneSceneGraph`. */
    template: SceneGraph;
};
export declare const TEMPLATES: {
    readonly 'empty-studio': TemplateEntry;
    readonly 'two-bedroom': TemplateEntry;
    readonly 'garden-house': TemplateEntry;
};
export type TemplateId = keyof typeof TEMPLATES;
/** Type guard for external callers that receive arbitrary string ids. */
export declare function isTemplateId(id: string): id is TemplateId;
//# sourceMappingURL=index.d.ts.map