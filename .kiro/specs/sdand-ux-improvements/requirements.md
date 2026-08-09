# Requirements Document

## Introduction

Набор улучшений UX для редактора выставочных стендов sdand-constructor. Изменения охватывают поведение кнопки Reset, добавление кнопки Undo, скрытие вкладки «Сцена», перенос загрузки плана в таб «Стройка», корректную мобильную вёрстку, скрытый сайдбар при запуске на мобильных устройствах, а также завершение рисования подиума через кнопку DONE.

## Glossary

- **Editor**: компонент редактора (apps/editor/app/page.tsx + packages/editor).
- **Reset**: кнопка сброса состояния сцены, расположенная в верхнем правом углу.
- **Undo**: кнопка отмены последнего действия, использующая Zundo temporal store.
- **Zundo**: библиотека undo/redo для Zustand; точка входа — `useScene.temporal.getState()`.
- **SIDEBAR_TABS**: массив конфигурации вкладок сайдбара в apps/editor/app/page.tsx.
- **BuildTab**: компонент вкладки «Стройка» (apps/editor/components/build-tab.tsx).
- **SlabTool**: инструмент рисования подиума (packages/nodes/src/slab/tool.tsx).
- **BottomSheet**: мобильный нижний лист сайдбара (packages/editor/src/components/editor/editor-layout-mobile.tsx).
- **MobileTabBar**: нижняя навигационная панель на мобильных устройствах.
- **venue-scan**: нода типа `scan`, представляющая 3D-скан выставочной площадки.
- **VenueId**: идентификатор площадки (`'gostinka'` | `'manezh'`).
- **SHEET_HANDLE_PX**: высота ручки BottomSheet в пикселях (24 px); минимальное состояние листа.
- **DONE-кнопка**: круглая зелёная кнопка ✓ (check), появляющаяся при активном инструменте.

## Requirements

### Requirement 1: Reset сохраняет площадку

**User Story:** As a пользователь редактора, I want нажать Reset и сохранить выбранную площадку, so that мне не нужно повторно выбирать площадку после каждого сброса сцены.

#### Acceptance Criteria

1. WHEN пользователь нажимает кнопку Reset, THE Editor SHALL очистить все ноды сцены, кроме нод типа `venue-scan`, принадлежащих текущей выбранной площадке.
2. WHEN пользователь нажимает кнопку Reset, THE Editor SHALL сохранить текущее значение `selectedVenue` без изменений.
3. WHEN пользователь нажимает кнопку Reset, THE Editor SHALL вызвать `applySceneGraphToEditor(null)` для очистки объектов сцены.
4. WHEN пользователь нажимает кнопку Reset, THE Editor SHALL сбросить состояние инструмента: `phase='site'`, `mode='select'`, `tool=null`, `catalogCategory=null`.
5. IF `selectedVenue` равно `null` в момент нажатия Reset, THEN THE Editor SHALL выполнить полный сброс сцены, как и прежде (без площадки).

### Requirement 2: Кнопка Undo

**User Story:** As a пользователь редактора, I want нажать кнопку Undo рядом с Reset, so that я могу отменить последнее действие без клавиатуры.

#### Acceptance Criteria

1. THE Editor SHALL отображать кнопку Undo (иконка ↩, `RotateCcw` или аналог) рядом с кнопкой Reset в верхнем правом углу.
2. WHEN пользователь нажимает кнопку Undo, THE Editor SHALL вызвать `useScene.temporal.getState().undo()`.
3. WHEN история изменений пуста (`pastStates` = []), THE Editor SHALL отображать кнопку Undo в визуально отключённом состоянии (disabled / opacity снижена).
4. THE Editor SHALL поддерживать нажатие кнопки Undo через touch-событие на мобильных устройствах (атрибут `touch-manipulation`).

### Requirement 3: Скрыть вкладку «Сцена»

**User Story:** As a пользователь редактора, I want не видеть вкладку «Сцена» (иерархия объектов) в сайдбаре, so that интерфейс сайдбара остаётся упрощённым.

#### Acceptance Criteria

1. THE Editor SHALL не отображать вкладку с `id: 'site'` и `label: 'Сцена'` в десктопном сайдбаре (IconRail).
2. THE Editor SHALL не отображать вкладку «Сцена» в мобильном MobileTabBar.
3. WHEN массив `SIDEBAR_TABS` обрабатывается, THE Editor SHALL использовать только вкладки с `id: 'build'` и `id: 'settings'` (вкладка `site` исключена из массива).
4. WHILE вкладка «Сцена» удалена из `SIDEBAR_TABS`, THE Editor SHALL сохранить функциональность встроенной `SitePanel` редактора (она управляется внутри Editor-компонента независимо от `sidebarTabs`).

### Requirement 4: Кнопка «Загрузить план» в BuildTab

**User Story:** As a пользователь редактора, I want загружать план/скан площадки прямо из вкладки «Стройка», so that мне не нужно искать эту функцию в других местах интерфейса.

#### Acceptance Criteria

1. THE BuildTab SHALL отображать кнопку «Загрузить план» (иконка Upload) в сетке инструментов.
2. WHEN пользователь нажимает кнопку «Загрузить план», THE BuildTab SHALL вызвать логику загрузки файла (.glb/.gltf), аналогичную существующей функции `loadStandFromFile`, но предназначенную для загрузки venue-scan / floor-plan.
3. WHEN файл успешно загружен, THE BuildTab SHALL поместить загруженную модель в сцену как item-нода через `useEditor`.
4. IF пользователь закрывает диалог выбора файла без выбора, THEN THE BuildTab SHALL не изменять состояние сцены.

### Requirement 5: Мобильная вёрстка — полный экран

**User Story:** As a пользователь мобильного устройства, I want редактор занимал весь экран устройства, so that нет пустых полос и браузерный chrome не перекрывает контент.

#### Acceptance Criteria

1. THE Editor SHALL использовать `height: 100dvh` (dynamic viewport height) для корневого контейнера в `globals.css` или inline-стилях страницы.
2. THE Editor SHALL содержать `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` в `layout.tsx`.
3. WHILE устройство имеет iOS Safe Area (notch / home bar), THE Editor SHALL применять `env(safe-area-inset-*)` padding чтобы контент не перекрывался системными элементами.

### Requirement 6: Мобильный сайдбар скрыт при запуске

**User Story:** As a пользователь мобильного устройства, I want сайдбар был свёрнут при первом открытии редактора, so that 3D-сцена занимает весь экран и сайдбар не перекрывает её.

#### Acceptance Criteria

1. WHEN редактор загружается на мобильном устройстве, THE BottomSheet SHALL открыться на высоте `SHEET_HANDLE_PX` (только ручка), а не на `mobileDefaultSnap * middleH`.
2. THE BottomSheet SHALL отображать drag-ручку, за которую пользователь может потянуть, чтобы раскрыть панель.
3. WHEN пользователь нажимает на вкладку в MobileTabBar, THE BottomSheet SHALL раскрыться до `mobileDefaultSnap * middleH` для выбранной вкладки.
4. WHERE требуется кнопка «Развернуть панель», THE Editor SHALL отображать визуальный элемент (кнопка или метка) поверх ручки, сигнализирующий о возможности раскрыть панель.

### Requirement 7: Подиум — DONE замыкает контур

**User Story:** As a пользователь редактора, I want нажать кнопку DONE во время рисования подиума (tool='slab') и получить готовый подиум, so that я могу завершить рисование касанием одной кнопки без необходимости кликать у первой вершины.

#### Acceptance Criteria

1. WHEN пользователь нажимает DONE (кнопка ✓ в `page.tsx`) WHILE активен инструмент `tool='slab'` AND `points.length >= 3`, THE SlabTool SHALL вызвать `commitSlabDrawing` с накопленными точками и завершить рисование.
2. WHEN пользователь нажимает DONE WHILE активен инструмент `tool='slab'` AND `points.length < 3`, THE Editor SHALL выполнить стандартное поведение DONE (снятие инструмента) без создания подиума.
3. WHEN подиум успешно создан через DONE, THE SlabTool SHALL очистить список точек (`points = []`) и сбросить инструмент в режим select.
4. THE Editor SHALL реализовать механизм финализации через глобальный event emitter (`emitter.emit('slab:commit')`) или аналогичный паттерн, совместимый с архитектурой SlabTool.
