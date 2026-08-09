'use client'

import type { SpawnNode } from '@pascal-app/core'

// Sdand: спавн-флажок скрыт из сцены целиком (registry-layer overlay
// игнорирует `visible={false}` на группе, поэтому проще возвращать null).
const SpawnRenderer = (_props: { node: SpawnNode }) => null

export default SpawnRenderer
