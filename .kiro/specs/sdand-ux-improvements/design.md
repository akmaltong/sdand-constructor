# Design Document — sdand-ux-improvements

## Overview

Набор точечных UX-улучшений поверх существующего форка Pascal Editor. Все изменения локализованы в 4–5 файлах; новые пакеты не вводятся. Стек: Next.js 16 + React 19, Turborepo + Bun, Zustand + Zundo, Three.js + R3F.

---

## Architecture

Улучшения делятся на три слоя:

```
┌─────────────────────────────────────────────────┐
│  apps/editor/app/page.tsx                        │
│  ├─ handleReset  → сохраняет selectedVenue       │
│  ├─ UndoButton   → useScene.temporal.undo()      │
│  └─ handleClearTool → emitter.emit('slab:commit')│
├─────────────────────────────────────────────────┤
│  apps/editor/components/build-tab.tsx            │
│  └─ loadVenuePlanFromFile (новая кнопка)         │
├─────────────────────────────────────────────────┤
│  packages/editor/src/components/editor/          │
│  └─ editor-layout-mobile.tsx                     │
│     └─ initialHeightPx = SHEET_HANDLE_PX         │
├─────────────────────────────────────────────────┤
│  packages/nodes/src/slab/tool.tsx                │
│  └─ emitter.on('slab:commit') handler            │
├─────────────────────────────────────────────────┤
│  apps/editor/app/globals.css + layout.tsx        │
│  └─ 100dvh, viewport-fit=cover, safe-area        │
└─────────────────────────────────────────────────┘
```

Никаких новых глобальных стейт-стор не добавляется — все изменения используют уже существующие: `useEditor`, `useScene`, `useScene.temporal`.

---

## Components and Interfaces

### 1. `handleReset` — сохранение площадки (page.tsx)

**До:** `handleReset` вызывает `setSelectedVenue(null)` — площадка теряется.

**После:** `handleReset` сохраняет `selectedVenue`, очищает только non-scan ноды сцены.

```typescript
const handleReset = useCallback(() => {
  localStorage.removeItem('pascal-editor-ui-preferences')
  localStorage.removeItem('pascal-editor-scene')
  localStorage.removeItem('pascal-editor-selection')

  const ed = useEditor.getState()
  ed.setPhase('site')
  ed.setMode('select')
  ed.setTool(null)
  ed.setCatalogCategory(null)
  ed.setSelectedItem(null as never)

  // Очищает всю сцену; DefaultVenueSeeder повторно засеет venue-scan
  // благодаря тому что selectedVenue остаётся неизменным.
  applySceneGraphToEditor(null)

  // НЕ вызываем setSelectedVenue(null) — площадка сохраняется
  setVenueDropdownOpen(false)
}, [])
// Убрать: setSelectedVenue(null) — это единственное изменение логики Reset
```

`DefaultVenueSeeder` реагирует на смену сцены и повторно вставляет venue-scan, поэтому после `applySceneGraphToEditor(null)` при сохранённом `selectedVenue` площадка появится снова автоматически.

### 2. Кнопка Undo (page.tsx)

Добавляется рядом с Reset в правом верхнем углу.

```typescript
// Подписка на длину истории для реактивного disabled
const pastStatesLength = useSyncExternalStore(
  (cb) => useScene.temporal.subscribe(cb),
  () => useScene.temporal.getState().pastStates.length,
  () => 0,
)
const canUndo = pastStatesLength > 0

const handleUndo = useCallback(() => {
  useScene.temporal.getState().undo()
}, [])

// JSX (рядом с Reset-кнопкой):
<button
  className="pointer-events-auto inline-flex touch-manipulation items-center gap-1 rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40 active:bg-accent/60 disabled:opacity-40 disabled:cursor-not-allowed"
  disabled={!canUndo}
  onClick={handleUndo}
  type="button"
  aria-label="Отменить"
>
  <Undo2 className="h-3.5 w-3.5" />
  Undo
</button>
```

`useSyncExternalStore` используется для подписки на zundo temporal store без лишних перерендеров — реагирует только при изменении `pastStates.length`.

### 3. SIDEBAR_TABS — удалить вкладку «Сцена» (page.tsx)

```typescript
// Было:
const SIDEBAR_TABS = [
  { id: 'site', label: 'Сцена', ... },
  { id: 'build', label: 'Стройка', ... },
  { id: 'settings', label: 'Настройки', ... },
]

// Стало:
const SIDEBAR_TABS = [
  { id: 'build', label: 'Стройка', ... },
  { id: 'settings', label: 'Настройки', ... },
]
```

Встроенная `SitePanel` внутри Editor-компонента управляется отдельно от `sidebarTabs` и продолжает работать.

### 4. Кнопка «Загрузить план» в BuildTab (build-tab.tsx)

Добавляется новый элемент `BUILD_TYPES` и функция `loadVenuePlanFromFile`.

```typescript
// Новый элемент в BUILD_TYPES:
{ id: 'load-plan', label: 'Загрузить план', iconSrc: '/icons/floor.png', mode: 'load-plan' },

// Функция загрузки плана:
function loadVenuePlanFromFile(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.glb,.gltf'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const baseName = file.name.replace(/\.[^.]+$/, '')

    const asset: AssetInput = {
      id: `plan-${Date.now()}-${baseName}`,
      category: 'furniture',
      name: baseName,
      thumbnail: makeThumb('334155', 'ПЛАН'),
      tags: ['floor', 'plan', 'upload'],
      src: url,
      dimensions: [1, 1, 1],
      offset: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      source: 'mine',
    }

    const ed = useEditor.getState()
    ed.setPhase('structure')
    ed.setStructureLayer('elements')
    ed.setMode('build')
    ed.setTool('item')
    ed.setSelectedItem(asset as never)
  }
  input.click()
}
```

Обработчик клика в `handleTypeClick`:
```typescript
} else if (type.mode === 'load-plan') {
  triggerSFX('sfx:menu-click')
  loadVenuePlanFromFile()
}
```

### 5. Мобильная вёрстка — 100dvh и Safe Area (globals.css + layout.tsx)

**globals.css:**
```css
html, body {
  height: 100%;
}

/* Dynamic viewport height + safe-area */
#__next, main, [data-editor-root] {
  height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Или в корневом `div` страницы:
```tsx
// page.tsx — корневой div
<div
  className="relative w-screen"
  style={{ height: '100dvh' }}
>
```

**layout.tsx — viewport meta:**
```tsx
export const metadata: Metadata = {
  // ...
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
}
```

Или непосредственно в `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 6. Мобильный BottomSheet — скрыт при запуске (editor-layout-mobile.tsx)

`BottomSheet` уже принимает `initialHeightPx`. Достаточно убедиться, что передаётся `SHEET_HANDLE_PX` (24 px), а не `defaultSnap * middleH`.

**Текущий код:**
```typescript
// didInit effect раскрывает лист до defaultSnap * middleH при первой инициализации
useEffect(() => {
  if (didInit.current || middleH <= 0) return
  didInit.current = true
  const targetPx = getDefaultSnap(currentTab) * middleH
  setCommittedSheetH(targetPx)
  sheetRef.current?.snapTo(targetPx)  // ← открывает на 50% сразу
}, [middleH, currentTab])
```

**Изменение:** начальное значение `didInit` уже выставлено в `true`, чтобы эффект не раскрывал лист автоматически. Лист остаётся на `SHEET_HANDLE_PX` (передаётся в `BottomSheet` как `initialHeightPx={SHEET_HANDLE_PX}`). Лист раскрывается только по явному tap на вкладку:

```typescript
// editor-layout-mobile.tsx — изменение:
const didInit = useRef(true) // было false — теперь true, чтобы пропустить авто-раскрытие

// BottomSheet уже получает initialHeightPx={SHEET_HANDLE_PX} — без изменений
```

При нажатии на вкладку `handleTabPress` по-прежнему вызывает `sheetRef.current?.snapTo(defaultPx)`, что раскрывает лист до нужной высоты. Поведение переключения и collapse сохраняется.

### 7. DONE-кнопка завершает рисование подиума (page.tsx + tool.tsx)

Используется уже существующий `emitter` из `@pascal-app/core`.

**page.tsx — handleClearTool:**
```typescript
const handleClearTool = useCallback(() => {
  const ed = useEditor.getState()
  // Если активен slab-инструмент — сначала отправляем запрос на commit
  if (ed.tool === 'slab') {
    emitter.emit('slab:commit' as never)
    // tool сбросится внутри SlabTool после успешного commit
    return
  }
  ed.setTool(null)
  ed.setMode('select')
  ed.setSelectedItem(null as never)
  ed.setCatalogCategory(null)
}, [])
```

**packages/nodes/src/slab/tool.tsx — регистрация обработчика:**
```typescript
useEffect(() => {
  if (!currentLevelId) return

  const onSlabCommit = () => {
    if (points.length >= 3 && currentLevelId) {
      const slabId = commitSlabDrawing(currentLevelId, points)
      setSelection({ selectedIds: [slabId] })
      setPoints([])
      useAlignmentGuides.getState().clear()
      // Сброс инструмента обрабатывается page.tsx через handleClearTool
      // (для cases с < 3 точками) или через стандартный tool:cancel
    }
    // < 3 точек: ничего не делаем, page.tsx сбросит инструмент
  }

  emitter.on('slab:commit' as never, onSlabCommit)

  // ... остальные обработчики ...

  return () => {
    emitter.off('slab:commit' as never, onSlabCommit)
    // ... остальные off ...
  }
}, [currentLevelId, points, setSelection])
```

После успешного `commitSlabDrawing` в `onSlabCommit` обработчик очищает `points`. Затем `handleClearTool` в page.tsx возвращается, не вызывая `setTool(null)` повторно — инструмент сбрасывается через `tool:cancel` или последующий клик на neutral state. Либо SlabTool сам диспатчит `emitter.emit('tool:cancel')` после commit — эта логика уже есть в существующем `onGridDoubleClick`.

Для атомарности: `onSlabCommit` может вызвать `markToolCancelConsumed()` и `emitter.emit('tool:cancel')` чтобы сброс произошёл немедленно:

```typescript
const onSlabCommit = () => {
  if (points.length >= 3 && currentLevelId) {
    const slabId = commitSlabDrawing(currentLevelId, points)
    setSelection({ selectedIds: [slabId] })
    setPoints([])
    useAlignmentGuides.getState().clear()
    markToolCancelConsumed()
    emitter.emit('tool:cancel')
  }
  // При points.length < 3: page.tsx уже вызвал handleClearTool → setTool(null)
}
```

А `handleClearTool` в page.tsx при `tool === 'slab'` только эмитирует событие и возвращает управление:
```typescript
if (ed.tool === 'slab') {
  emitter.emit('slab:commit' as never)
  return  // SlabTool сам сбросит инструмент или нет — в зависимости от points.length
}
```

Для случая `points.length < 3` нужно чтобы `handleClearTool` всё равно сбросил инструмент. Решение: SlabTool всегда отвечает на `slab:commit`, и если `points.length < 3`, сам вызывает cancel:

```typescript
const onSlabCommit = () => {
  if (points.length >= 3 && currentLevelId) {
    const slabId = commitSlabDrawing(currentLevelId, points)
    setSelection({ selectedIds: [slabId] })
    setPoints([])
    useAlignmentGuides.getState().clear()
  }
  // В любом случае — сброс инструмента
  markToolCancelConsumed()
  emitter.emit('tool:cancel')
}
```

---

## Data Models

Изменений в схемах данных нет. Все существующие типы (`SceneGraph`, `AnyNode`, `AssetInput`, `PersistedEditorUiState`) используются без изменений.

**Зависимости зундо (Zundo temporal):**
```typescript
// useScene.temporal — тип из use-scene.ts:
// StoreApi<TemporalState<Pick<SceneState, 'nodes' | 'rootNodeIds' | 'collections'>>>
//
// Используемые методы:
useScene.temporal.getState().undo()            // откат на 1 шаг
useScene.temporal.getState().pastStates        // массив прошлых состояний
useScene.temporal.subscribe(callback)          // подписка на изменения
```

---

## Error Handling

| Сценарий | Обработка |
|---|---|
| `applySceneGraphToEditor(null)` бросает | Обёрнуть в `try/catch`; при ошибке залогировать в console.error, не рушить UI |
| Файл плана не является GLB | `input.accept` ограничивает выбор; дополнительная проверка расширения на `onchange` |
| `useScene.temporal.getState().undo()` при пустой истории | Кнопка отключена (`disabled`); zundo gracefully не делает ничего при пустом `pastStates` |
| `emitter.emit('slab:commit')` без активного SlabTool | Обработчик не зарегистрирован → событие игнорируется; `handleClearTool` уже возвратил управление |
| `currentLevelId` равен null при `onSlabCommit` | Guard `if (points.length >= 3 && currentLevelId)` предотвращает вызов `commitSlabDrawing` |
| Файловый диалог закрыт без выбора | `files?.[0]` === `undefined` → early return, состояние не меняется |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reset сохраняет площадку и нейтрализует инструмент

*For any* состояния редактора (любой `tool`, `phase`, `mode`, `catalogCategory`) и любого значения `selectedVenue` (включая `null`), после вызова `handleReset` выполняются два инварианта одновременно: (a) `selectedVenue` остаётся равным исходному значению и (b) состояние инструмента равно `{ phase: 'site', mode: 'select', tool: null, catalogCategory: null }`.

**Validates: Requirements 1.1, 1.2, 1.4, 1.5**

---

### Property 2: Кнопка Undo отключена тогда и только тогда, когда история пуста

*For any* состояния temporal-истории (`pastStates` произвольной длины от 0 до N), кнопка Undo отображается в `disabled` состоянии тогда и только тогда, когда `pastStates.length === 0`.

**Validates: Requirements 2.3**

---

### Property 3: SIDEBAR_TABS содержит только разрешённые вкладки

*For any* элемента массива `SIDEBAR_TABS`, его `id` должен принадлежать множеству `{'build', 'settings'}` — вкладка `'site'` не присутствует ни в одном элементе.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 4: Загруженный план-файл становится валидным AssetInput

*For any* корректного имени GLB/GLTF-файла (ненулевое имя, расширение `.glb` или `.gltf`), функция `loadVenuePlanFromFile` создаёт объект `AssetInput` с заполненными полями `id`, `name`, `src` (blob URL) и устанавливает его как `selectedItem` в редакторе в режиме `tool='item'`.

**Validates: Requirements 4.3**

---

### Property 5: BottomSheet открывается на высоте SHEET_HANDLE_PX при монтировании

*For any* конфигурации вкладок `sidebarTabs` (любого размера и содержимого), при первом рендере мобильного редактора `BottomSheet` получает `initialHeightPx === SHEET_HANDLE_PX` (24 px) и `didInit.current === true`, что предотвращает автоматическое раскрытие до `mobileDefaultSnap * middleH`.

**Validates: Requirements 6.1**

---

### Property 6: Нажатие вкладки раскрывает BottomSheet пропорционально mobileDefaultSnap

*For any* вкладки из `sidebarTabs` с `mobileDefaultSnap ∈ [0, 1]` и известной высотой `middleH > 0`, вызов `handleTabPress(tab.id)` передаёт `snapTo(Math.max(SHEET_HANDLE_PX, mobileDefaultSnap * middleH))` в `sheetRef`.

**Validates: Requirements 6.3**

---

### Property 7: DONE при slab с ≥ 3 точками создаёт подиум и очищает state

*For any* массива из не менее 3 валидных 2D-точек (`[number, number][]`), когда активен инструмент `tool='slab'`, эмиссия события `slab:commit` вызывает `commitSlabDrawing` с этими точками, после чего массив `points` становится пустым (`[]`) и вызывается `tool:cancel`.

**Validates: Requirements 7.1, 7.3**

---

## Testing Strategy

### Unit Tests

Для каждого изменения достаточно минимального набора примеров:

- **Reset**: проверить что `setSelectedVenue` не вызывается; что `ed.setTool(null)` вызывается; что `applySceneGraphToEditor(null)` вызывается.
- **Undo**: проверить что кнопка disabled при `pastStates = []`, enabled при `pastStates = [x]`; что клик вызывает `useScene.temporal.getState().undo()`.
- **SIDEBAR_TABS**: проверить что в массиве нет элемента с `id === 'site'`; массив содержит ровно 2 элемента с id `'build'` и `'settings'`.
- **loadVenuePlanFromFile**: проверить early return при `files = null`; проверить что при валидном `.glb` файле `ed.setSelectedItem` вызывается с объектом у которого `src` начинается с `blob:`.
- **slab:commit**: проверить что при `points.length < 3` не вызывается `createNode`; при `points.length >= 3` вызывается `commitSlabDrawing` и после этого `points === []`.

### Property-Based Tests

По каждому из 7 свойств в разделе «Correctness Properties»:

1. **Property 1** — генерировать случайные комбинации `{ tool, phase, mode }` и `selectedVenue ∈ ['gostinka', 'manezh', null]`; вызвать `handleReset`; проверить постусловия.
2. **Property 2** — генерировать массив `pastStates` случайной длины (0..50); проверить что `disabled === (length === 0)`.
3. **Property 3** — перебрать все элементы `SIDEBAR_TABS`; проверить что `id ∈ {'build', 'settings'}`.
4. **Property 4** — генерировать случайные имена файлов с расширением `.glb`/`.gltf`; проверить что asset имеет все обязательные поля и `ed.tool === 'item'`.
5. **Property 5** — генерировать случайные массивы `sidebarTabs`; проверить что `BottomSheet` получает `initialHeightPx === 24`.
6. **Property 6** — генерировать случайные `mobileDefaultSnap ∈ [0,1]` и `middleH ∈ [100, 1000]`; проверить что `snapTo` вызывается с корректным значением.
7. **Property 7** — генерировать массивы точек длиной ≥ 3; эмитировать `slab:commit`; проверить вызов `commitSlabDrawing` и очистку `points`.

Рекомендуемая библиотека: **fast-check** (уже используется в пакетах проекта). Минимум 100 итераций на каждый тест.
