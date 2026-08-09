// Worker polyfill: must be imported FIRST before any three imports.
// Three.js main entry point references `window` during module evaluation,
// which doesn't exist in a Web Worker (only `self`).
(globalThis as any).window = globalThis;