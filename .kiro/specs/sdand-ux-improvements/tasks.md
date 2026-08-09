# Implementation Plan: sdand-ux-improvements

## Overview

Набор точечных UX-улучшений поверх существующего форка Pascal Editor. Изменения локализованы в 5 файлах: `apps/editor/app/page.tsx`, `apps/editor/components/build-tab.tsx`, `apps/editor/app/globals.css`, `apps/editor/app/layout.tsx`, `packages/editor/src/components/editor/editor-layout-mobile.tsx`, `packages/nodes/src/slab/tool.tsx`. Стек: TypeScript, Next.js + React 19, Zustand + Zundo, fast-check для PBT.

Все правки используют уже существующие сторы (`useEditor`, `useScene`, `useScene.temporal`) и эмиттер `@pascal-app/core` — никаких новых зависимостей.

## Tasks

- [ ] 1. Исправить handleReset — сохранять selectedVenue
  - [ ] 1.1 Убрать вызов `setSelectedVenue(null)` из `handleReset` в `apps/editor/app/page.tsx`
    - Найти текущий вызов `setSelectedVenue(null)` внутри `handleReset` и удалить его
    - Убедиться, что `applySceneGraphToEditor(null)` по-прежнему вызывается (очищает ноды)
    - Сохранить вызовы `ed.setPhase('site')`, `ed.setMode('select')`, `ed.setTool(null)`, `ed.setCatalogCategory(null)`, `ed.setSelectedItem(null as never)`
    - Убедиться, что `setVenueDropdownOpen(false)` вызывается
    - `DefaultVenueSeeder` автоматически пересеет venue-scan при изменении сцены при сохранённом `selectedVenue`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Написать property-тест для handleReset (Property 1)
    - **Property 1: Reset сохраняет площадку и нейтрализует инструмент**
    - Генерировать случайные комбинации `{ tool, phase, mode }` и `selectedVenue ∈ ['gostinka', 'manezh', null]`
    - Вызвать `handleReset`; проверить что `selectedVenue` не изменился и `ed.setTool(null)` был вызван
    - Использовать `fast-check` (`fc.record`, `fc.oneof`, `fc.constant`), минимум 100 итераций
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

- [ ] 2. Добавить кнопку Undo в правый верхний угол (page.tsx)
  - [ ] 2.1 Реализовать подписку на temporal-историю через `useSyncExternalStore`
    - Добавить импорт `useSyncExternalStore` из `react`
    - Добавить импорт `Undo2` из `lucide-react`
    - Добавить `pastStatesLength` через `useSyncExternalStore(useScene.temporal.subscribe, ...)`
    - Вычислить `canUndo = pastStatesLength > 0`
    - Добавить `handleUndo = useCallback(() => useScene.temporal.getState().undo(), [])`
    - _Requirements: 2.2, 2.3_

  - [ ] 2.2 Добавить JSX кнопки Undo рядом с Reset-кнопкой
    - Разместить кнопку с иконкой `Undo2` и текстом «Undo» рядом с Reset в правом верхнем углу
    - Применить те же Tailwind-классы что у Reset (`rounded-md border border-border bg-background/90 ...`)
    - Добавить `disabled={!canUndo}`, `onClick={handleUndo}`, `aria-label="Отменить"`, `touch-manipulation`
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 2.3 Написать property-тест для кнопки Undo (Property 2)
    - **Property 2: Кнопка Undo disabled тогда и только тогда, когда история пуста**
    - Генерировать массив `pastStates` случайной длины 0..50
    - Проверить что `canUndo === (pastStates.length > 0)` при любой длине
    - **Validates: Requirements 2.3**

- [ ] 3. Удалить вкладку «Сцена» из SIDEBAR_TABS (page.tsx)
  - [ ] 3.1 Убрать элемент с `id: 'site'` из массива `SIDEBAR_TABS`
    - В `apps/editor/app/page.tsx` найти определение `SIDEBAR_TABS`
    - Удалить элемент `{ id: 'site', label: 'Сцена', ... }` из массива
    - Оставить только `{ id: 'build', ... }` и `{ id: 'settings', ... }`
    - Убедиться, что встроенная `SitePanel` внутри Editor-компонента не зависит от `sidebarTabs` и продолжает работать
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.2 Написать property-тест для SIDEBAR_TABS (Property 3)
    - **Property 3: SIDEBAR_TABS содержит только разрешённые вкладки**
    - Перебрать все элементы `SIDEBAR_TABS`; проверить что каждый `id ∈ {'build', 'settings'}`
    - Убедиться что ни один элемент не имеет `id === 'site'`
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 4. Добавить кнопку «Загрузить план» в BuildTab (build-tab.tsx)
  - [ ] 4.1 Реализовать функцию `loadVenuePlanFromFile` и добавить элемент в `BUILD_TYPES`
    - В `apps/editor/components/build-tab.tsx` добавить новый элемент в `BUILD_TYPES`: `{ id: 'load-plan', label: 'Загрузить план', iconSrc: '/icons/floor.png', mode: 'load-plan' }`
    - Реализовать функцию `loadVenuePlanFromFile()`:
      - Создать `<input type="file" accept=".glb,.gltf">` через DOM
      - В `onchange`: получить файл, создать `URL.createObjectURL(file)`, сформировать `AssetInput` с `id: 'plan-\${Date.now()}-\${baseName}'`, `category: 'furniture'`, `src: url`
      - Проверить что `files?.[0]` не `undefined` — early return при отсутствии файла
      - Вызвать `ed.setPhase('structure')`, `ed.setStructureLayer('elements')`, `ed.setMode('build')`, `ed.setTool('item')`, `ed.setSelectedItem(asset as never)`
    - В `handleTypeClick` добавить ветку `else if (type.mode === 'load-plan') { triggerSFX('sfx:menu-click'); loadVenuePlanFromFile() }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Написать property-тест для loadVenuePlanFromFile (Property 4)
    - **Property 4: Загруженный план-файл становится валидным AssetInput**
    - Генерировать случайные имена файлов с расширением `.glb` или `.gltf` (через `fc.string` + суффикс)
    - Замокать `URL.createObjectURL` → возвращает `'blob:fake'`
    - Проверить что `ed.setSelectedItem` вызван с объектом у которого заполнены `id`, `name`, `src` и `ed.tool === 'item'`
    - **Validates: Requirements 4.3**

- [ ] 5. Мобильная вёрстка — 100dvh и Safe Area
  - [ ] 5.1 Добавить `100dvh` и `env(safe-area-inset-*)` в `globals.css`
    - В `apps/editor/app/globals.css` убедиться что `html, body` имеют `height: 100%`
    - Добавить правило для корневых контейнеров (`#__next`, `main`, `[data-editor-root]` или корневой `div` страницы): `height: 100dvh`
    - Добавить `padding-top: env(safe-area-inset-top)`, `padding-bottom: env(safe-area-inset-bottom)`, `padding-left: env(safe-area-inset-left)`, `padding-right: env(safe-area-inset-right)`
    - Альтернативно: добавить `style={{ height: '100dvh' }}` на корневой `div` в `page.tsx`
    - _Requirements: 5.1, 5.3_

  - [ ] 5.2 Добавить `viewport-fit=cover` в `layout.tsx`
    - В `apps/editor/app/layout.tsx` обновить экспорт `viewport` (или `metadata.viewport`) добавив `viewportFit: 'cover'` (Next.js Metadata API) или напрямую строку `'width=device-width, initial-scale=1, viewport-fit=cover'`
    - _Requirements: 5.2_

- [ ] 6. Мобильный BottomSheet — скрыт при запуске (editor-layout-mobile.tsx)
  - [ ] 6.1 Изменить `didInit` на `useRef(true)` чтобы отключить авто-раскрытие
    - В `packages/editor/src/components/editor/editor-layout-mobile.tsx` найти `const didInit = useRef(false)`
    - Заменить на `const didInit = useRef(true)` — эффект инициализации увидит `didInit.current === true` и пропустит авто-раскрытие до `mobileDefaultSnap * middleH`
    - Убедиться что `BottomSheet` получает `initialHeightPx={SHEET_HANDLE_PX}` (24 px) — если уже передаётся, ничего не менять
    - Убедиться что `handleTabPress` по-прежнему вызывает `sheetRef.current?.snapTo(defaultPx)` для раскрытия по тапу
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.2 Написать property-тест для BottomSheet initialHeight (Property 5)
    - **Property 5: BottomSheet открывается на высоте SHEET_HANDLE_PX при монтировании**
    - Генерировать случайные массивы `sidebarTabs` (через `fc.array(fc.record({ id: fc.string(), ... }))`)
    - Проверить что при `didInit.current === true` начальная высота листа равна `SHEET_HANDLE_PX` (24)
    - **Validates: Requirements 6.1**

  - [ ]* 6.3 Написать property-тест для handleTabPress (Property 6)
    - **Property 6: Нажатие вкладки раскрывает BottomSheet пропорционально mobileDefaultSnap**
    - Генерировать `mobileDefaultSnap ∈ [0, 1]` и `middleH ∈ [100, 1000]`
    - Проверить что `snapTo` вызывается с `Math.max(SHEET_HANDLE_PX, mobileDefaultSnap * middleH)`
    - **Validates: Requirements 6.3**

- [ ] 7. Checkpoint — убедиться что всё собирается и работает
  - Ensure all tests pass, ask the user if questions arise.
  - Запустить `bun x tsc --build --force` в `packages/editor` и `packages/nodes` для проверки типов

- [ ] 8. DONE-кнопка завершает рисование подиума
  - [ ] 8.1 Обновить `handleClearTool` в `page.tsx` для эмиссии `slab:commit`
    - В `apps/editor/app/page.tsx` найти `handleClearTool`
    - Добавить импорт `emitter` из `@pascal-app/core` (если ещё не импортирован)
    - В начало `handleClearTool` добавить проверку: `if (ed.tool === 'slab') { emitter.emit('slab:commit' as never); return }`
    - При `tool !== 'slab'` оставить существующую логику: `ed.setTool(null)`, `ed.setMode('select')`, `ed.setSelectedItem(null as never)`, `ed.setCatalogCategory(null)`
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 8.2 Добавить обработчик `slab:commit` в `SlabTool` (tool.tsx)
    - В `packages/nodes/src/slab/tool.tsx` найти `useEffect` с подписками на emitter
    - Добавить подписку: `emitter.on('slab:commit' as never, onSlabCommit)`
    - Реализовать `onSlabCommit`:
      - Если `points.length >= 3 && currentLevelId`: вызвать `commitSlabDrawing(currentLevelId, points)`, затем `setSelection({ selectedIds: [slabId] })`, `setPoints([])`, `useAlignmentGuides.getState().clear()`
      - В любом случае — вызвать `markToolCancelConsumed()` и `emitter.emit('tool:cancel')` для сброса инструмента
    - Не забыть `emitter.off('slab:commit' as never, onSlabCommit)` в cleanup функции
    - Добавить `points` в массив зависимостей `useEffect`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 8.3 Написать property-тест для slab:commit (Property 7)
    - **Property 7: DONE при slab с ≥ 3 точками создаёт подиум и очищает state**
    - Генерировать массивы `[number, number][]` длиной ≥ 3 (через `fc.array(fc.tuple(fc.float(), fc.float()), { minLength: 3 })`)
    - Эмитировать `slab:commit`; проверить что `commitSlabDrawing` вызван с этими точками и `points` стал `[]`
    - Также проверить что при `points.length < 2` `commitSlabDrawing` не вызывается
    - Использовать `fast-check`, минимум 100 итераций
    - **Validates: Requirements 7.1, 7.3**

- [ ] 9. Final Checkpoint — финальная проверка
  - Ensure all tests pass, ask the user if questions arise.
  - Запустить `bun x tsc --build --force` во всех изменённых пакетах
  - Проверить сборку `bun dev` локально и убедиться что Reset сохраняет площадку, Undo работает, вкладка «Сцена» скрыта, кнопка «Загрузить план» появилась, BottomSheet свёрнут при запуске, DONE завершает подиум

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Все изменения локализованы в существующих файлах — новые пакеты не добавляются
- PBT используют `fast-check` (уже есть в проекте), минимум 100 итераций на каждый тест
- Property-тесты дополняют unit-тесты, а не заменяют их

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "5.1", "5.2"] },
    { "id": 1, "tasks": ["2.1", "4.1", "6.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "8.2"] },
    { "id": 3, "tasks": ["1.2", "2.3", "3.2", "4.2", "8.3"] },
    { "id": 4, "tasks": ["6.2", "6.3"] }
  ]
}
```
