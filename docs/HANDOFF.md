# HANDOFF — sdand-constructor

Компактный контекст для продолжения работы в новом чате.

## Что это

Web-конфигуратор выставочных стендов на форке [Pascal Editor](https://github.com/pascalorg/editor) `editor-0.9.1`. Пользователь выбирает выставочную площадку (Гостинка / Манеж), расставляет подиумы и интерактивное оборудование (LED-панели, touch-экраны, аркады, VR-стойки).

## Ссылки

- **Prod:** https://sdand-constructor.vercel.app/
- **GitHub:** https://github.com/akmaltong/sdand-constructor (public)
- **Локальный корень:** `C:\SdandConstructor\`
- **Форк:** `C:\SdandConstructor\sdand-constructor\` (Turborepo + Bun)
- **Reference (нетронутый оригинал):** `C:\SdandConstructor\editor-0.9.1\`

## Стек

- Next.js 16 + React 19, Turborepo, Bun 1.3
- Three.js + WebGPU + React Three Fiber + Drei
- Zustand (`useScene`, `useEditor`, `useViewer`), Zundo (undo/redo), Zod
- Git LFS для `.glb`/`.bin` (venue 12 MB, equipment 10× ~1 MB)
- Vercel prod deploy (project `akmal7/sdand-constructor`), `vercel --prod --yes` из `sdand-constructor/`

## Запуск локально

```bash
cd C:\SdandConstructor\sdand-constructor
bun install                  # если ещё не ставили
bun dev                      # -> http://localhost:3002
```

Для preview в моих сессиях: `preview_start` с `name: 'sdand-editor'` (см. `C:\SdandConstructor\.claude\launch.json`).

## Структура пакетов

```
sdand-constructor/
├─ apps/editor/
│  ├─ app/page.tsx                    # ГЛАВНАЯ композиция: Editor + venue-picker + Reset + DONE-кнопка
│  ├─ app/thumb-gen/page.tsx          # оффскрин-рендер PNG-превью для equipment
│  ├─ components/build-tab.tsx        # 3 инструмента: Стена, Пол, Покраска
│  ├─ components/default-venue-seeder.tsx  # сидер + миграция venue-scan
│  ├─ components/viewer-toolbar.tsx   # правый бар (Display/Walkthrough/Preview — все скрыты)
│  ├─ lib/venue-seed.ts               # syncDefaultVenue()
│  └─ public/
│     ├─ venues/SM_GostinnyDwor.glb   # Гостинка (сжато 134→13 MB через gltfpack -cc)
│     ├─ venues/SM_Manezh.glb         # Манеж (248 KB)
│     └─ equipment/                   # 16 моделей + thumbs/*.png
├─ packages/
│  ├─ core/                           # схемы, use-scene, spatial-grid
│  ├─ viewer/                         # 3D рендер, resolveCdnUrl
│  ├─ editor/                         # UI редактора
│  │  └─ src/components/ui/item-catalog/catalog-items.tsx  # каталог: 10 подиумов + 12 экранов + 4 стойки
│  └─ nodes/                          # определения узлов
```

## Ключевые точки правок

| Задача | Файл |
|--------|------|
| Каталог подиумов и equipment | `packages/editor/src/components/ui/item-catalog/catalog-items.tsx` |
| Инструменты Build-панели | `apps/editor/components/build-tab.tsx` |
| Категории (Стенды/Стойки/Экраны) | `packages/editor/src/components/ui/action-menu/furnish-tools.tsx` |
| Панель настроек (Сохранить/Загрузить/Очистить) | `packages/editor/src/components/ui/sidebar/panels/settings-panel/index.tsx` |
| Venue-scan рендер + скрытие Potolok001 + пол → белый | `packages/nodes/src/scan/renderer.tsx` |
| Venue-scan 2D-контур (footprint rect) | `packages/nodes/src/scan/definition.ts` |
| Скрытие spawn-флажков | `packages/nodes/src/spawn/renderer.tsx` (`return null`) |
| Скрытие оранжевой site boundary в 3D | `packages/nodes/src/site/renderer.tsx` |
| SiteNode.polygon default = `[]` | `packages/core/src/schema/nodes/site.ts` |
| Скрытие 2D property-line + вершин | `packages/editor/src/components/editor/floorplan-panel.tsx` (`visibleSitePolygon = null`) |
| Скрытие подсказок Pan/Rotate/Zoom и tool-hints | `packages/editor/src/components/editor/index.tsx` (state=false) + `packages/editor/src/components/ui/helpers/helper-manager.tsx` (return null) |
| Скрытие нижнего action-menu | `packages/editor/src/components/ui/action-menu/index.tsx` (return null) |
| Reset без авто-Стена | `packages/editor/src/lib/scene.ts` (empty level → phase='site', tool=null) |
| Drag-rotate snap 45° | `packages/editor/src/components/editor/node-arrow-handles.tsx` |
| Resize-стрелки на items (scale x/y/z) | `packages/nodes/src/item/definition.ts` (`itemScaleHandle`) |
| Primitive-box рендер (учёт scale) | `packages/nodes/src/item/renderer.tsx` (`getScaledDimensions`) |
| Allowlist для `primitive:`/`blob:`/`data:` | `packages/core/src/schema/asset-url.ts` |
| Resolver для `blob:`/`data:` | `packages/viewer/src/lib/asset-url.ts` |

## Что сделано (сжато)

1. **Форк Pascal Editor** → sdand-constructor, ребрендинг
2. **UI урезан:** Build = 3 tool (Стена/Пол/Покраска), Sidebar = 4 tab (Сцена/Стройка/Стенды/Настройки), правый viewer-toolbar скрыт, нижний action-menu скрыт, tool-hints скрыты, camera-controls-hint скрыт, dev-indicator скрыт, react-scan скрыт
3. **Русификация** всех user-facing строк
4. **Каталог Стенды** = 10 подиумов (плоские boxGeometry высотой 0.1м, primitive:box:<hex>) с resize-стрелками X/Y/Z
5. **Каталог Стойки** = 4 equipment (arcade, vr_ar, platforma_rgb, xbox_kinect) + 8 Touch-панелей
6. **Каталог Экраны** = 4 LCD/LED
7. **Импорт своей модели/текстуры** — .glb/.gltf → useGLTF; .png/.jpg/.webp → primitive:tex:<url>
8. **Venue-сидер** (`DefaultVenueSeeder`) — площадка вставляется как Scan-нода, миграция footprint, sweeper мёртвых blob-URL, миграция asset при обновлении CATALOG_ITEMS. venue=null → удаляет все venue-scan (для Reset)
9. **Гостинка + Манеж** — 2 площадки в дропдауне «Площадка ▾» в центре сверху
10. **2D-вид** — контур площадки (rect без fill), метровая сетка внутри
11. **Пол Гостинки** — белый (детект тонкого большого mesh у пола)
12. **Материал стен** — тёплый `#ede4d3` (Marble Crema Marfil / гипсокартон)
13. **Кнопка DONE** (галка ✓, 80×80 px, зелёная, справа-снизу) — снимает активный инструмент, работает на touch
14. **Кнопка Reset** — очищает scene + сбрасывает venue
15. **Vercel prod deploy** — автопуш при `git push` + LFS работает
16. **Git LFS для .glb/.bin** — большие модели через `git lfs`

## Известные грабли

- **Turbopack HMR** держит стейл-чанки. После правки в `packages/*/src` часто нужен `location.reload()` + иногда `bun x tsc --build --force` в пакете.
- **IndexedDB scene-storage** держит persisted scene. При изменении asset/venue меняем seeder, чтобы мигрировать существующие ноды.
- **Vercel 100 MB file limit** — крупные .glb сжимаем через `bunx gltfpack -i <in> -o <out> -cc` (обычно 10× reduction).
- **Vercel deploy** — если GitHub webhook не сработал, вручную: `cd sdand-constructor && vercel --prod --yes`.
- **Unreal-экспорт .glb** — часто mesh в мировых координатах исходной сцены (offset y=+8..20 м). Мерять bbox через `scratchpad/measure-glb.mjs`, offset = `[-cx, -bb.min.y, -cz]` для pivot в центре нижней грани.
- **Site polygon** — если сделать пустым `[]`, старый SiteRenderer возвращал null → **вся сцена не рендерилась**. Убрал early-return.

## Скрипты

- `scratchpad/measure-glb.mjs` — парсит .glb, выдаёт bbox+offset для каждой модели
- `scratchpad/list-mesh-names.mjs` — имена meshes/nodes в .glb (для HIDDEN_NODE_NAMES в scan-renderer)
- `scratchpad/save-thumbs.mjs` — декодирует batch base64 PNG в файлы

## Что осталось (открытые задачи)

- **Коллизия** пользователь жалуется на возможность ставить equipment внахлёст. Уже вызывается `canPlaceOnFloor` + `getGridAlignedDimensions` округляет до 0.5м. Возможно нужно посмотреть кейсы (два item одинакового типа в одной клетке) или увеличить effective footprint для тонких моделей.
- **Мобильная версия** — Pascal уже адаптирован через `useIsMobile`. Кнопка DONE + touch-manipulation готово. При жалобах — проверить конкретные жесты.

## Полезные команды

```bash
# Force-rebuild пакета после HMR-залипа
cd C:\SdandConstructor\sdand-constructor\packages\<name>
bun x tsc --build --force

# Vercel prod deploy вручную
cd C:\SdandConstructor\sdand-constructor
vercel --prod --yes

# Сжать .glb
bunx gltfpack -i input.glb -o output.glb -cc

# Измерить bbox всех .glb в папке
bun scratchpad/measure-glb.mjs C:/SdandConstructor/sdand-constructor/apps/editor/public/venues
```

## Последние коммиты (git log)

```
[pending] feat: UX-улучшения по запросу заказчика (08.08.2026)
  - Reset сохраняет площадку (убран setSelectedVenue(null))
  - Кнопка Undo (↩) рядом с Reset — Zundo temporal.undo()
  - Удалена вкладка «Сцена» из SIDEBAR_TABS
  - Кнопка «Загрузить план» в BuildTab (.glb/.gltf/.png/.jpg)
  - Мобильный полный экран: 100dvh + viewport-fit=cover + safe-area-inset
  - Мобильный сайдбар свёрнут при запуске (didInit=true)
  - DONE замыкает рисование подиума (slab:commit emitter)
13ee89f feat: большая кнопка DONE (галка ✓)
269b5cc feat: кнопка Отмена + не блокировать сцену пустым polygon
4ccc694 fix: убрать флажки spawn, метки site, Reset очищает venue
563cf44 chore(venue): SM_GostinnyDwor вместо SM_GOSTINKA
427057a fix: убрать флажки spawn, Reset, picker в дропдаун
0746442 feat: Settings урезан до сохранения/загрузки/очистки + сжатие venue
7f4a3e0 fix: убрать авто-Стена после Reset + убрать 3D property-line
985c0e2 chore(editor): сетка приподнята на 0.05 над полом
892814b feat: пикер площадок Гостинка/Манеж + Save/Reset + скан-хэндлы
```
