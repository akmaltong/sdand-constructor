# Sdand Constructor — Handoff

Форк Pascal Editor (editor-0.9.1) под конфигуратор выставочных стендов. Русский UI, каталог подиумов/экранов/оборудования, две площадки (Гостинка/Манеж), импорт своих GLB-стендов.

## Ссылки

- Prod: https://sdand-constructor.vercel.app/
- Repo: https://github.com/akmaltong/sdand-constructor (main)
- Корень проекта: `C:\SdandConstructor\sdand-constructor`

## Стек

- Next.js 16 (Turbopack) + React 19, Bun 1.3, Turborepo
- Three.js + @react-three/fiber + drei + WebGPU
- Zustand (`useScene`, `useEditor`, `useViewer`, `useSidebarStore`)
- Git LFS для `.glb`/`.bin`
- Vercel prod: `vercel --prod --yes`

## Структура (что где править)

| Слой | Путь | Что тут |
|---|---|---|
| composition | `apps/editor/app/page.tsx` | верхний бар, DONE, dropdown Площадка, Reset |
| build-panel | `apps/editor/components/build-tab.tsx` | 6 инструментов, «Мои стенды», импорт GLB |
| viewer-toolbar | `apps/editor/components/viewer-toolbar.tsx` | ««/3D/2D, LevelMode, DisplayMenu |
| stand-import | `apps/editor/lib/stand-import.ts` | `importStandModel(file)` — main-thread GLTFLoader.parse |
| item-renderer | `packages/nodes/src/item/renderer.tsx` | `StandModelRenderer` — draft=bbox, real=`scene.clone(true)` |
| mobile-layout | `packages/editor/src/components/editor/editor-layout-mobile.tsx` | bottom-sheet, tab-bar, isCollapsed hide |
| site-renderer | `packages/nodes/src/site/renderer.tsx` | не return null при empty polygon |
| spawn-renderer | `packages/nodes/src/spawn/renderer.tsx` | return null (флажок спавна скрыт) |

## Что сделано (готово к демо)

- Русификация всего UI, каталог полностью заменён (подиумы / оборудование / экраны / покраска / загрузка стенда).
- 2 площадки Гостинка (СМ_GostinnyDwor.glb, сжатый meshopt до 13 MB) и Манеж, dropdown ▾ по центру верхнего бара.
- Верхний бар компактно в один ряд на mobile: ««, 3D, 2D, Площадка, Undo, Reset (все на `top-3`, центр `cy=28`).
- 3D/2D — только текст, без иконок.
- Кнопка DONE (✓, зелёная) вместо Esc — `apps/editor/app/page.tsx:294-304`, `top-16` mobile / `top-20` desktop, не пересекается с bottom-sheet.
- Mobile bottom-sheet: стартует свёрнутым (`SHEET_HANDLE_PX`). Кнопка «« (`CollapseSidebarButton`) прячет и sheet, и tab-bar; при `isCollapsed` viewer занимает всю высоту.
- Импорт GLB: main-thread `GLTFLoader.parse` с DRACO+Meshopt (как useGLTF для каталога), 60-с таймаут защита. Импорт кладёт в «Мои стенды», НЕ ставит на сцену авто — юзер сам кликает карточку.
- Draft-preview импортированного стенда = boxGeometry (`isTransient`), полный `scene.clone(true)` только после placement — иначе main thread замирал.
- Settings: только Save/Load + Reset. Всё остальное вырезано.
- «Сцена флажок» (`SpawnRenderer`) полностью скрыт.
- SiteRenderer чинил early-return: пустой polygon больше не гасит всю сцену.

## Что запаковано для заказчика

- Standalone Next.js bundle (`output: 'standalone'` в `apps/editor/next.config.ts`), 246 MB ZIP.
- Требования: Node 20+.
- Запуск: `cd apps/editor && node server.js` (`PORT=8080` для смены порта).
- README.txt внутри архива с инструкцией.

## Локальная работа

```bash
cd C:\SdandConstructor\sdand-constructor
bun install
bun run dev
# apps/editor слушает http://localhost:3002
```

Preview через `preview_start` в MCP: `{ url: "http://localhost:3002" }`.

## Известные грабли

- **Git LFS**: `.glb` идут через LFS, при клоне на новом хосте: `git lfs install && git lfs pull`.
- **Blob URL смертны**: `URL.createObjectURL` живёт только до reload. Импортированные стенды в persist-scene после перезагрузки страницы дают `Could not load blob:...` — нужен Reset.
- **HMR-кеш workers**: если правишь `apps/editor/lib/stand-parse.worker.ts` — Turbopack иногда не пересобирает; hard-reload или перезапуск dev-сервера.
- **Vercel 100 MB file limit**: если добавляешь .glb — сожми `bunx gltfpack -cc input.glb output.glb`.
- **`backups/*.zip` блокировали push** — в `.gitignore`, не убирать.
- **DRACO wasm с CDN**: `stand-import.ts` тянет `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`. Если у заказчика закрытый контур — положить wasm локально в `public/draco/` и поменять `draco.setDecoderPath('/draco/')`.

## Backlog / что улучшать дальше

**Приоритет 1 — известные UX проблемы:**
- [ ] Collision-detection: подиумы/оборудование могут накладываться друг на друга (пользователь жаловался давно, отложено).
- [ ] Импорт GLB блокирует main thread на 5-30 сек для тяжёлых моделей (VTB_StandPack ~48 MB). Показать loading-overlay с прогрессом (сейчас есть только `standLoading` спиннер на кнопке).
- [ ] «Мои стенды» не персистятся — после reload список пуст (blob URL мёртвый). Персистить file blob в IndexedDB и восстанавливать.
- [ ] Thumbnail для импортированного стенда — сейчас generic «GLB» SVG. Рендерить offscreen-канвас с 3D-превью.

**Приоритет 2 — фичи:**
- [ ] Snap-to-grid при перетаскивании (magneticSnap уже есть, но не для placement).
- [ ] Мерка/линейка на сцене (расстояния между объектами).
- [ ] Копирование выделенного объекта (Ctrl+D).
- [ ] Групповое выделение (rubber-band).
- [ ] Экспорт сцены в GLB (композиция площадки + стенды одним файлом).
- [ ] PDF-план сцены (top-down 2D → печать).

**Приоритет 3 — деплой/распространение:**
- [ ] Локальный DRACO decoder для air-gapped установок.
- [ ] Docker-образ (Dockerfile на базе `output: standalone`).
- [ ] Static export вариант (если заказчику нужно на nginx без Node).
- [ ] Multi-tenant: список сцен принадлежит юзеру (сейчас всё в общем IndexedDB).
- [ ] Аутентификация (nextauth/clerk) — если ставить публично.

**Приоритет 4 — код-качество:**
- [ ] TypeScript `ignoreBuildErrors: true` в next.config.ts — прогнать `tsc --noEmit` по всему монорепо и починить.
- [ ] Убрать `worker` подход к импорту (`stand-parse.worker.ts` + polyfill) — сейчас не используется, но код лежит.

## Полезные команды

```bash
# Пересборка пакетов после правок packages/*
bun x tsc --build --force

# Компрессия GLB
bunx gltfpack -cc input.glb output.glb

# Vercel deploy
vercel --prod --yes

# Собрать standalone bundle
bun run build
cp -r apps/editor/public apps/editor/.next/standalone/apps/editor/public
cp -r apps/editor/.next/static apps/editor/.next/standalone/apps/editor/.next/static
```

## Контекст для следующего чата

Читай `MEMORY.md`-index в `C:\Users\akmal\.claude\projects\C--SdandConstructor\memory\` — там компактные заметки про стек, прогресс, грабли и роль пользователя. Плюс этот файл. Начинать разговор можно с «Продолжаем sdand-constructor, HANDOFF.md прочитай».
