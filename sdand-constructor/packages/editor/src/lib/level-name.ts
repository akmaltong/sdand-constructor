import type { LevelNode } from '@pascal-app/core'

export function getDefaultLevelName(level: number): string {
  if (level === 0) return 'Уровень 1'
  if (level > 0) return `Уровень ${level + 1}`
  return `Подвал ${-level}`
}

export function getLevelDisplayName(level: Pick<LevelNode, 'name' | 'level'>): string {
  return level.name || getDefaultLevelName(level.level)
}
