# ARCHITECTURE

## База

Стартуем на форке **[Pascal Editor](https://github.com/pascalorg/editor)** (`editor-0.9.1`) — открытом 3D-редакторе зданий на React Three Fiber + WebGPU.

## Что уже есть в базе (переиспользуем)

| Возможность                         | Где живёт                                    | Наше применение |
|-------------------------------------|----------------------------------------------|-----------------|
| Scene graph (Site→Building→Level→…) | `packages/core/src/schema/`                  | Зал = Building, площадь = Level, зоны/стенды = Zone/Item |
| Стены с CSG-вырезами                | `WallSystem`                                 | Перегородки стендов |
| Зоны (Zone)                         | `ZoneRenderer` + `ZoneSystem`                | Площади под стенды |
| Items (мебель, светильники)         | `ItemSystem`                                 | 3D-модели стендов |
| Спатиальная сетка + коллизии        | `spatialGridManager.canPlaceOnFloor()`       | Правило «где занято — нельзя» |
| Guide (2D-подложка)                 | `GuideSystem`                                | Импорт плана зала |
| Zustand store + undo/redo           | `useScene`, Zundo                            | Редактирование сцены |
| Persist в IndexedDB                 | `useScene` middleware                        | Автосохранение |
| Event bus                           | mitt                                         | Клики по стендам, hover, контекст |
| Selection managers                  | `apps/editor`                                | Выбор стенда/зоны/уровня |
| MCP-сервер                          | `packages/mcp`                               | AI-агенты для генерации стендов |
| IFC-импорт                          | `apps/ifc-converter`                         | Импорт планов зданий CAD |

## Что добавляем

### Новые пакеты
| Пакет                    | Задача |
|--------------------------|--------|
| `@sdand/scene-schema`    | Расширение схемы: `Stand`, `Booth`, `Aisle` поверх Zone/Item |
| `@sdand/snapping`        | Snap к метровой сетке, поворот кратно 45° |
| `@sdand/model-registry`  | Каталог моделей заказчиков, версии, превью |
| `@sdand/model-processor` | Пайплайн авто-фикса pivot/масштаба + генерация превью |
| `@sdand/sync`            | Realtime-обёртка (Yjs / WebSocket) |
| `@sdand/ai-generator`    | LLM-обёртка для генерации стендов по параметрам |
| `@sdand/billing`         | Тарифы «весь продукт» / «час работы», интеграция ЮKassa |
| `@sdand/ui`              | Общие React-компоненты (кнопки, формы, панели) |

### Новые приложения
| App                     | Задача |
|-------------------------|--------|
| `apps/editor` *(есть)*  | Основной 3D-конструктор (переиспользуем + расширяем) |
| `apps/web`              | Маркетинг + личный кабинет заказчика |
| `apps/admin`            | Панель организатора: заявки, площади, статусы |
| `apps/ifc-converter` *(есть)* | Импорт планов зданий |

### Сервисы (backend)
| Сервис                     | Стек | Задача |
|----------------------------|------|--------|
| `services/api`             | Node / Hono | REST/GraphQL: авторизация, сцены, заказы |
| `services/realtime`        | WebSocket / Yjs-provider | Синхронизация редактирования |
| `services/storage`         | S3-совместимое (MinIO/Yandex Object Storage) | gltf/obj, картинки |
| `services/model-processor` | Python + trimesh / Blender headless | Обработка моделей в фоне |

## Целевая структура репозитория

```
sdand-constructor/
├─ apps/
│  ├─ editor/            # 3D-конструктор (форк apps/editor из Pascal)
│  ├─ ifc-converter/     # импорт планов CAD
│  ├─ web/               # NEW: лендинг + ЛК заказчика
│  └─ admin/             # NEW: панель организатора
├─ packages/
│  ├─ core/              # scene graph, схемы, store
│  ├─ viewer/            # 3D-рендер
│  ├─ editor/            # UI редактора
│  ├─ mcp/               # AI-агенты
│  ├─ nodes/             # определения узлов
│  ├─ ui/                # NEW: общие UI-компоненты
│  ├─ ifc-converter/
│  ├─ scene-schema/      # NEW: Stand/Booth/Aisle схемы
│  ├─ snapping/          # NEW: сетка, 45° повороты
│  ├─ model-registry/    # NEW: каталог моделей
│  ├─ model-processor/   # NEW: pivot/scale fix (клиентская часть)
│  ├─ sync/              # NEW: realtime-клиент
│  ├─ ai-generator/      # NEW: LLM-обёртка
│  ├─ billing/           # NEW: тарифы
│  ├─ eslint-config/
│  └─ typescript-config/
├─ services/
│  ├─ api/               # NEW
│  ├─ realtime/          # NEW
│  ├─ storage/           # NEW (config + миграции)
│  └─ model-processor/   # NEW: Python-воркер
├─ infra/
│  ├─ docker/
│  └─ compose.yaml       # dev-окружение целиком
├─ docs/
│  ├─ SPEC.md
│  ├─ ROADMAP.md
│  ├─ ESTIMATE.md
│  └─ ARCHITECTURE.md
└─ package.json          # Bun workspaces + Turborepo (как в базе)
```

## Границы слоёв (наследуем из Pascal)

- `packages/core` — чистая логика домена, никаких Three.js.
- `packages/viewer` — 3D-рендер, не знает про инструменты редактора.
- `packages/editor` — UI редактирования, инструменты, панели.
- `apps/*` — композиция и специфичные фичи приложения.

Наши новые пакеты (`scene-schema`, `snapping`, `model-registry` и т.д.) добавляются как отдельные модули поверх core/viewer/editor, не нарушая границ.

## Технологический стек (наследуем + добавляем)

**Из базы:**
- Next.js 16 + React 19
- Three.js (WebGPU) + React Three Fiber + Drei
- Zustand + Zundo (undo/redo)
- Zod (валидация)
- three-bvh-csg
- Turborepo + Bun

**Добавляем:**
- Yjs или Liveblocks — realtime
- Hono или Fastify — API
- Postgres + Drizzle — БД
- MinIO / S3 — хранилище моделей
- BullMQ + Redis — очередь обработки моделей
- Python + trimesh / Blender headless — фикс pivot/масштаба
- Anthropic Claude API — AI-генератор стендов
- ЮKassa — платежи

## План внедрения

1. **Сейчас (docs):** зафиксировать SPEC/ROADMAP/ESTIMATE/ARCHITECTURE.
2. **Далее (Этап 1):** форк `editor-0.9.1`, ребрендинг, MVP-фичи из [ROADMAP.md](ROADMAP.md).
3. **Затем (Этап 2):** полная платформа с backend, синхронизацией, AI и биллингом.
