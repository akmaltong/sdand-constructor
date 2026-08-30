// In-world resize / move arrow descriptors. Each `NodeDefinition` may
// declare a `handles` list (or a `(node) => list` function for shape-
// dependent affordances). The editor mounts a single generic component
// that reads these descriptors and renders the arrows / drag logic — no
// per-kind handles file needed.
//
// Pure data + small per-descriptor callbacks: no Three.js, React, or
// editor imports here so this stays in core. The descriptors are
// evaluated by the editor at drag time (`apply` etc.) so the callbacks
// run in the editor's context — they see the live node and the scene
// API but otherwise do not import 3D libraries.
//
// Layered intentionally:
//   - axis-resize    : symmetric scaling around center (column W/D, height)
//   - edge-resize    : anchored on one edge, the other follows the pointer
//                      (door width: drag right edge, left edge stays)
//   - vertical-resize: linear-resize specialised for world-Y (height arrow
//                      anchored at bottom; window top-edge anchored at
//                      bottom; window bottom-edge anchored at top)
//   - radial-resize  : 1:1 outward growth of a radial field (column radius)
//   - arc-resize     : curved/spiral stair sweep / inner-radius / rise
//   - endpoint-move  : wall / fence endpoint drag (snapping is bespoke,
//                      so it delegates to a kind-supplied callback)
export {};
