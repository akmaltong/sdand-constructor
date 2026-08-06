# Sdand Constructor

Web-конфигуратор для застройщиков выставочных стендов.

Форк [Pascal Editor](https://github.com/pascalorg/editor) (`editor-0.9.1`) —
3D-редактор зданий на React Three Fiber + WebGPU. Адаптируем под задачу
проектирования и расстановки выставочных стендов с метровой привязкой,
коллизиями, библиотекой моделей и синхронизацией между заказчиками.

## Документация

Все проектные документы — в [../docs/](../docs/):
- [SPEC.md](../docs/SPEC.md) — ТЗ
- [ROADMAP.md](../docs/ROADMAP.md) — этапы поставки
- [ESTIMATE.md](../docs/ESTIMATE.md) — смета
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) — структура репо и стек

## Быстрый старт

```bash
bun install
bun dev
```

Редактор поднимется на `http://localhost:3002`.

## Технологии базы

- Next.js 16 + React 19
- Three.js (WebGPU) + React Three Fiber + Drei
- Zustand + Zundo (undo/redo)
- Zod, three-bvh-csg
- Turborepo + Bun

## Слои (наследованы из Pascal)

| Пакет | Ответственность |
|-------|-----------------|
| `packages/core` | Схема сцены, состояние, системы генерации геометрии |
| `packages/viewer` | 3D-рендер |
| `packages/editor` | UI редактирования |
| `apps/editor` | Основное приложение конструктора |

## Лицензия

MIT (унаследовано из [LICENSE](LICENSE)).
