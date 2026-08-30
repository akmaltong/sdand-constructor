import type { SceneGraph } from '@pascal-app/core/clone-scene-graph';
/** Mutation kinds handled by `applyMutation`. */
export type MutationKind = 'wall-thickness' | 'wall-height' | 'zone-labels' | 'room-proportions' | 'open-plan' | 'door-positions' | 'fence-style';
/** Deterministic seeded RNG. */
export type Rng = () => number;
/**
 * Tiny Park-Miller PRNG. Returns a function that produces uniformly
 * distributed floats in [0, 1) without bitwise operators.
 */
export declare function mulberry32(seed: number): Rng;
/** Pure: apply a single mutation and return a fresh graph. */
export declare function applyMutation(graph: SceneGraph, rng: Rng, kind: MutationKind): SceneGraph;
/**
 * Human-readable summary of the mutations applied to a variant. Reads the
 * interesting fields from the graph (e.g. first wall's thickness/height).
 */
export declare function describeVariant(graph: SceneGraph, mutations: readonly MutationKind[]): string;
//# sourceMappingURL=mutations.d.ts.map