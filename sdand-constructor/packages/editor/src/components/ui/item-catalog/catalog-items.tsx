import type { AssetInput } from '@pascal-app/core'

// Sdand-конструктор: каталог состоит из двух частей.
//   1) STANDS — примитивные кубы-стенды (src=`primitive:box:<hex>`),
//      рендерятся напрямую в ItemRenderer без сети.
//   2) VENDOR_ITEMS — модели из Pascal-каталога на Supabase CDN,
//      подходящие для выставочных сцен: стойки, экраны, мебель, оборудование.
//      Тянутся по HTTPS, разрешено в AssetUrl-схеме.
//
// Категории Pascal:
//   furniture → Стенды (кубы)
//   appliance → Оборудование (техника: TV, лампы, розетки, кондиционер…)
//   kitchen   → Стойки (стеллажи, колонны, ресепшн-подобные элементы)
//   bathroom  → Экраны (телевизоры, картины/постеры, зеркала)
//   outdoor   → Мебель (диваны, стулья, столы, растения, ковры)

type StandSpec = {
  id: string
  name: string
  size: [number, number, number]
  color: string
}

const STANDS: StandSpec[] = [
  { id: 'stand-1x1x1', name: 'Стенд 1×1×1', size: [1, 1, 1], color: 'ef4444' },
  { id: 'stand-2x2x2', name: 'Стенд 2×2×2', size: [2, 2, 2], color: 'f97316' },
  { id: 'stand-3x2x2', name: 'Стенд 3×2×2', size: [3, 2, 2], color: 'eab308' },
  { id: 'stand-2x3x2', name: 'Стенд 2×3×2 (высокий)', size: [2, 3, 2], color: '22c55e' },
  { id: 'stand-4x2x3', name: 'Стенд 4×2×3', size: [4, 2, 3], color: '14b8a6' },
  { id: 'stand-3x3x3', name: 'Стенд 3×3×3', size: [3, 3, 3], color: '06b6d4' },
  { id: 'stand-5x2x3', name: 'Стенд 5×2×3', size: [5, 2, 3], color: '3b82f6' },
  { id: 'stand-4x4x4', name: 'Стенд 4×4×4', size: [4, 4, 4], color: '8b5cf6' },
  { id: 'stand-6x3x4', name: 'Стенд 6×3×4', size: [6, 3, 4], color: 'd946ef' },
  { id: 'stand-8x3x5', name: 'Стенд 8×3×5 (большой)', size: [8, 3, 5], color: 'ec4899' },
]

function thumbFor(color: string, size: [number, number, number]): string {
  const [w, h, d] = size
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'>
    <rect x='0' y='0' width='90' height='90' fill='#1f2937'/>
    <rect x='15' y='15' width='60' height='60' rx='8' fill='#${color}'/>
    <text x='45' y='52' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='700' fill='white'>${w}×${h}×${d}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const STAND_ITEMS: AssetInput[] = STANDS.map((s) => ({
  id: s.id,
  category: 'furniture',
  name: s.name,
  tags: ['floor', 'stand'],
  thumbnail: thumbFor(s.color, s.size),
  src: `primitive:box:${s.color}`,
  dimensions: s.size,
  offset: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  source: 'library',
}))

// Модели с Pascal-CDN, подходящие для выставочных стендов.
// Формат AssetInput: id, category, name, thumbnail, src, dimensions,
// offset, rotation, scale. attachTo для стен/потолка — как в исходном каталоге.

const CDN = 'https://byrpxoiotywskoojsrzd.supabase.co/storage/v1/object/public/items/system'

function cdnAsset(
  slug: string,
  name: string,
  category: AssetInput['category'],
  dimensions: [number, number, number],
  opts: Partial<AssetInput> & { modelPath?: string; thumbPath?: string; floorPlanPath?: string } = {},
): AssetInput {
  const {
    modelPath = 'model.glb',
    thumbPath = 'thumbnail.png',
    floorPlanPath = 'floor-plan.png',
    tags,
    offset,
    rotation,
    scale,
    surface,
    attachTo,
    interactive,
    recessed,
  } = opts
  return {
    id: slug,
    category,
    name,
    tags: tags ?? ['floor'],
    thumbnail: `${CDN}/${slug}/${thumbPath}`,
    src: `${CDN}/${slug}/${modelPath}`,
    floorPlanUrl: `${CDN}/${slug}/${floorPlanPath}`,
    dimensions,
    offset: offset ?? [0, 0, 0],
    rotation: rotation ?? [0, 0, 0],
    scale: scale ?? [1, 1, 1],
    source: 'library',
    ...(surface ? { surface } : {}),
    ...(attachTo ? { attachTo } : {}),
    ...(interactive ? { interactive } : {}),
    ...(recessed ? { recessed } : {}),
  }
}

// Стойки — стеллажи, полки, колонны, вешалки, мольберты (для баннеров).
const STOJKI: AssetInput[] = [
  cdnAsset('barbell-stand', 'Стойка металлическая', 'kitchen', [1.34, 1.22, 1.72], {
    tags: ['floor', 'stand'],
    offset: [-0.0173, 0, 0],
  }),
  cdnAsset('coat-rack', 'Вешалка-стойка', 'kitchen', [0.33, 1.76, 0.33], {
    tags: ['floor', 'stand'],
  }),
  cdnAsset('easel', 'Мольберт (для баннера)', 'kitchen', [0.99, 2.32, 0.55], {
    tags: ['floor', 'stand', 'display'],
    offset: [0, 0.0402, 0.0116],
  }),
  cdnAsset('column', 'Колонна декоративная', 'kitchen', [0.5, 2.5, 0.5], {
    tags: ['floor', 'stand'],
    offset: [0, 1.25, 0],
  }),
  cdnAsset('bookshelf', 'Стеллаж высокий', 'kitchen', [0.93, 1.99, 0.33], {
    tags: ['floor', 'stand', 'storage'],
    offset: [0, 0, 0.0032],
  }),
  cdnAsset(
    'ikea-kallax-1x4-moa2y49n',
    'Стеллаж-куб 2×4',
    'kitchen',
    [1.09, 2.06, 0.55],
    {
      tags: ['floor', 'stand', 'storage'],
      modelPath: 'models/item_model_ocVHS1SWDex5DeYc.glb',
      offset: [0, -0.0053, 0],
      scale: [1.4, 1.4, 1.4],
    },
  ),
  cdnAsset('shelf', 'Полка настенная', 'kitchen', [0.74, 0.04, 0.32], {
    tags: ['wall', 'shelf'],
    offset: [0, 0.02, 0],
    attachTo: 'wall-side',
    surface: { height: 0.04 },
  }),
]

// Экраны — телевизоры, картинки/постеры, зеркала.
const EKRANY: AssetInput[] = [
  cdnAsset('television', 'Телевизор напольный', 'bathroom', [1.62, 1.07, 0.38], {
    tags: ['floor', 'screen'],
  }),
  cdnAsset('picture', 'Постер / картина', 'bathroom', [1.47, 0.82, 0.06], {
    tags: ['wall', 'display'],
    offset: [0, 0.41, 0],
    attachTo: 'wall-side',
  }),
  cdnAsset('round-mirror', 'Зеркало круглое', 'bathroom', [0.57, 0.57, 0.05], {
    tags: ['wall', 'display'],
    offset: [0, 0.2848, 0],
    attachTo: 'wall-side',
  }),
]

// Мебель — диваны, стулья, столы, ковры, растения, лампы.
const MEBEL: AssetInput[] = [
  cdnAsset('sofa', 'Диван', 'outdoor', [2.06, 0.74, 1.01], {
    tags: ['floor', 'seating'],
    offset: [-0.0023, 0.009, 0.0459],
  }),
  cdnAsset('livingroom-chair', 'Кресло мягкое', 'outdoor', [1.1, 0.75, 1.07], {
    tags: ['floor', 'seating'],
    offset: [0, 0.0001, 0.0053],
  }),
  cdnAsset('lounge-chair', 'Кресло лаунж', 'outdoor', [0.68, 1.03, 1.26], {
    tags: ['floor', 'seating'],
    offset: [0, 0.0034, 0.0894],
  }),
  cdnAsset('office-chair', 'Стул офисный', 'outdoor', [0.66, 1.16, 0.69], {
    tags: ['floor', 'seating'],
    offset: [0.0024, 0.0015, 0.0332],
  }),
  cdnAsset('dining-chair', 'Стул', 'outdoor', [0.47, 0.87, 0.5], {
    tags: ['floor', 'seating'],
    offset: [0, 0, 0.0016],
  }),
  cdnAsset('stool', 'Табурет', 'outdoor', [0.52, 1.16, 0.55], {
    tags: ['floor', 'seating'],
  }),
  cdnAsset('office-table', 'Стол офисный', 'outdoor', [1.51, 0.76, 0.62], {
    tags: ['floor', 'table'],
    offset: [-0.0001, 0, -0.0052],
    surface: { height: 0.75 },
  }),
  cdnAsset('dining-table', 'Стол обеденный', 'outdoor', [2.16, 0.7, 0.95], {
    tags: ['floor', 'table'],
    offset: [0, 0, -0.0077],
    surface: { height: 0.7 },
  }),
  cdnAsset('coffee-table', 'Стол журнальный', 'outdoor', [1.72, 0.3, 1.04], {
    tags: ['floor', 'table'],
    offset: [0, 0, 0.0089],
    surface: { height: 0.3 },
  }),
  cdnAsset('bedside-table', 'Тумба', 'outdoor', [0.45, 0.48, 0.46], {
    tags: ['floor', 'table'],
    offset: [0.0005, 0, -0.0062],
    surface: { height: 0.48 },
  }),
  cdnAsset(
    'standing-desk-mo8wgz95',
    'Стол-стойка',
    'outdoor',
    [1.41, 0.85, 0.68],
    {
      tags: ['floor', 'table', 'stand'],
      modelPath: 'models/item_model_zzZ58018waP8VY6Z.glb',
      offset: [0, 0.4203, 0.0019],
      scale: [1.4, 1.4, 1.4],
    },
  ),
  cdnAsset('rectangular-carpet', 'Ковёр прямоугольный', 'outdoor', [2.78, 0.04, 1.81], {
    tags: ['floor', 'decor'],
    surface: { height: 0.03 },
  }),
  cdnAsset('round-carpet', 'Ковёр круглый', 'outdoor', [1.99, 0.05, 1.99], {
    tags: ['floor', 'decor'],
    surface: { height: 0.04 },
  }),
  cdnAsset('indoor-plant', 'Растение большое', 'outdoor', [0.69, 1.63, 0.83], {
    tags: ['floor', 'decor'],
    offset: [-0.0506, 0, 0.0664],
  }),
  cdnAsset('small-indoor-plant', 'Растение малое', 'outdoor', [0.4, 0.67, 0.38], {
    tags: ['floor', 'decor'],
    offset: [-0.0106, 0, 0.0067],
  }),
  cdnAsset('cactus', 'Кактус', 'outdoor', [0.34, 0.39, 0.27], {
    tags: ['floor', 'decor'],
    offset: [-0.0039, 0, 0],
  }),
  cdnAsset('floor-lamp', 'Торшер', 'outdoor', [0.7, 1.86, 0.69], {
    tags: ['floor', 'lighting'],
    offset: [0.0341, 0.0045, 0.0219],
  }),
  cdnAsset('table-lamp', 'Настольная лампа', 'outdoor', [0.29, 0.74, 0.67], {
    tags: ['countertop', 'lighting'],
  }),
  cdnAsset('trash-bin', 'Урна', 'outdoor', [0.35, 0.59, 0.42], {
    tags: ['floor'],
  }),
]

// Оборудование — техника, световое, розетки, инженерия.
const OBORUDOVANIE: AssetInput[] = [
  cdnAsset('ac-block', 'Кондиционер', 'appliance', [1.06, 0.95, 1.06], {
    tags: ['floor', 'hvac'],
    scale: [0.79, 0.79, 0.79],
  }),
  cdnAsset('stereo-speaker', 'Колонка / спикер', 'appliance', [0.4, 0.9, 0.4], {
    tags: ['floor', 'audio'],
  }),
  cdnAsset('ceiling-lamp', 'Люстра потолочная', 'appliance', [0.55, 0.86, 0.55], {
    tags: ['ceiling', 'lighting'],
    offset: [0, 0.8545, 0],
    attachTo: 'ceiling',
  }),
  cdnAsset('recessed-light', 'Встраиваемый светильник', 'appliance', [0.23, 0.06, 0.23], {
    tags: ['ceiling', 'lighting'],
    offset: [0, 0.0057, 0],
    attachTo: 'ceiling',
    recessed: true,
  }),
  cdnAsset('exit-sign', 'Табличка «Выход»', 'appliance', [0.54, 0.27, 0.1], {
    tags: ['wall', 'signage'],
    offset: [0, 0.0036, 0.0452],
    scale: [0.6, 0.5, 0.7],
    attachTo: 'wall-side',
  }),
  cdnAsset('sprinkler', 'Спринклер', 'appliance', [0.09, 0.04, 0.09], {
    tags: ['ceiling', 'safety'],
    offset: [0, 0.0386, 0],
    rotation: [Math.PI, 0, 0],
    attachTo: 'ceiling',
  }),
  cdnAsset(
    'power-outlet-moa09g0o',
    'Розетка',
    'appliance',
    [0.09, 0.09, 0.03],
    {
      tags: ['wall', 'electric'],
      modelPath: 'models/item_model_PTDhACPTrrrtLLeI.glb',
      offset: [0, 0.045, 0.0117],
      scale: [0.09, 0.09, 0.09],
      attachTo: 'wall-side',
    },
  ),
]

// Модели Interactive Equipment Catalog (репо akmaltong), лежат локально в
// apps/editor/public/equipment/. Размеры и offset измерены скриптом
// scratchpad/measure-glb.mjs из реальных bbox моделей: Unreal-экспорт
// сохранил все mesh в мировых координатах исходной сцены (высота +8–20 м
// от origin) — без корректировки offset модель улетала под потолок.
// offset = [-center.x, -bb.min.y, -center.z] ставит pivot в центр нижней
// грани, поэтому item встаёт на пол и центрируется под курсором.
//
// PNG-превью сгенерированы через /thumb-gen (offscreen R3F) в
// public/equipment/thumbs/. Сгенерировать заново — открыть эту страницу
// со списком src, скрипт scratchpad/save-thumbs.mjs сохранит PNG.
function equipAsset(
  file: string,
  name: string,
  category: AssetInput['category'],
  dimensions: [number, number, number],
  offset: [number, number, number],
): AssetInput {
  const base = file.replace(/\.glb$/, '')
  return {
    id: `equipment-${base}`,
    category,
    name,
    tags: ['floor', 'stand', 'equipment'],
    thumbnail: `/equipment/thumbs/${base}.png`,
    src: `/equipment/${file}`,
    dimensions,
    offset,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    source: 'library',
  }
}

// Экраны (bathroom): LCD/LED/сенсорные панели
const EQUIPMENT_SCREENS: AssetInput[] = [
  equipAsset('lcd_65.glb', 'LCD 65"', 'bathroom', [0.042, 0.755, 1.358], [-0.307, -20.05, -20.423]),
  equipAsset('lcd_sphere_d1000.glb', 'LCD-сфера Ø1000', 'bathroom', [1.0, 1.225, 1.0], [-0.296, -19.117, -17.531]),
  equipAsset('led_panel_1x2.5_p1.9.glb', 'LED панель 1×2.5', 'bathroom', [0.815, 2.575, 1.008], [-0.35, -19.103, -14.562]),
  equipAsset('led_panel_4x2.5_p1.9.glb', 'LED панель 4×2.5', 'bathroom', [0.815, 2.575, 4.011], [-0.35, -19.103, -11.119]),
  equipAsset('touch_11.glb', 'Touch 11"', 'bathroom', [0.774, 0.985, 0.995], [-0.111, -16.137, -20.562]),
  equipAsset('touch_43.glb', 'Touch 43"', 'bathroom', [0.774, 1.16, 1.042], [-0.124, -16.112, -17.624]),
  equipAsset('touch_43_art.glb', 'Touch 43" арт', 'bathroom', [0.774, 1.166, 1.176], [-0.226, -16.143, -14.686]),
  equipAsset('touch_55.glb', 'Touch 55"', 'bathroom', [0.461, 1.88, 0.763], [-0.314, -12.246, -20.569]),
  equipAsset('touch_55_double.glb', 'Touch 55" двойной', 'bathroom', [0.461, 1.88, 0.763], [-0.314, -12.246, -17.631]),
  equipAsset('touch_55_holobox.glb', 'Touch 55" голобокс', 'bathroom', [0.689, 2.177, 0.79], [-0.364, -11.966, -11.283]),
  equipAsset('touch_55_table_art.glb', 'Touch 55" стол-арт', 'bathroom', [0.966, 1.022, 2.504], [-0.418, -16.14, -11.206]),
  equipAsset('touch_55_transparency.glb', 'Touch 55" прозрачный', 'bathroom', [0.355, 1.782, 0.766], [-0.246, -12.304, -14.624]),
]

// Стойки (kitchen): аркады, платформы, VR, приставки
const EQUIPMENT_STANDS: AssetInput[] = [
  equipAsset('arcade.glb', 'Аркадный автомат', 'kitchen', [0.746, 1.542, 0.844], [-0.23, -8.868, -11.287]),
  equipAsset('vr_ar.glb', 'VR/AR стойка', 'kitchen', [0.774, 1.397, 0.995], [-0.236, -9.059, -14.683]),
  equipAsset('platforma_rgb.glb', 'RGB-платформа', 'kitchen', [1.042, 0.028, 1.042], [-0.2, -9.467, -17.56]),
  equipAsset('xbox_kinect.glb', 'Xbox Kinect', 'kitchen', [0.225, 0.104, 0.56], [-0.264, -9.678, -20.625]),
]

export const CATALOG_ITEMS: AssetInput[] = [
  ...STAND_ITEMS,
  ...EQUIPMENT_STANDS,
  ...STOJKI,
  ...EQUIPMENT_SCREENS,
  ...EKRANY,
  ...MEBEL,
  ...OBORUDOVANIE,
]

export function getDefaultCatalogItem(category: string | null | undefined): AssetInput | null {
  if (!category) return null
  return CATALOG_ITEMS.find((item) => item.category === category) ?? null
}
