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

// Экраны (bathroom): только LCD и LED-панели
const EQUIPMENT_SCREENS: AssetInput[] = [
  equipAsset('lcd_65.glb', 'LCD 65"', 'bathroom', [0.042, 0.755, 1.358], [-0.307, -20.05, -20.423]),
  equipAsset('lcd_sphere_d1000.glb', 'LCD-сфера Ø1000', 'bathroom', [1.0, 1.225, 1.0], [-0.296, -19.117, -17.531]),
  equipAsset('led_panel_1x2.5_p1.9.glb', 'LED панель 1×2.5', 'bathroom', [0.815, 2.575, 1.008], [-0.35, -19.103, -14.562]),
  equipAsset('led_panel_4x2.5_p1.9.glb', 'LED панель 4×2.5', 'bathroom', [0.815, 2.575, 4.011], [-0.35, -19.103, -11.119]),
]

// Стойки (kitchen): аркады, VR, платформы, приставки + все Touch-панели
const EQUIPMENT_STANDS: AssetInput[] = [
  equipAsset('arcade.glb', 'Аркадный автомат', 'kitchen', [0.746, 1.542, 0.844], [-0.23, -8.868, -11.287]),
  equipAsset('vr_ar.glb', 'VR/AR стойка', 'kitchen', [0.774, 1.397, 0.995], [-0.236, -9.059, -14.683]),
  equipAsset('platforma_rgb.glb', 'RGB-платформа', 'kitchen', [1.042, 0.028, 1.042], [-0.2, -9.467, -17.56]),
  equipAsset('xbox_kinect.glb', 'Xbox Kinect', 'kitchen', [0.225, 0.104, 0.56], [-0.264, -9.678, -20.625]),
  equipAsset('touch_11.glb', 'Touch 11"', 'kitchen', [0.774, 0.985, 0.995], [-0.111, -16.137, -20.562]),
  equipAsset('touch_43.glb', 'Touch 43"', 'kitchen', [0.774, 1.16, 1.042], [-0.124, -16.112, -17.624]),
  equipAsset('touch_43_art.glb', 'Touch 43" арт', 'kitchen', [0.774, 1.166, 1.176], [-0.226, -16.143, -14.686]),
  equipAsset('touch_55.glb', 'Touch 55"', 'kitchen', [0.461, 1.88, 0.763], [-0.314, -12.246, -20.569]),
  equipAsset('touch_55_double.glb', 'Touch 55" двойной', 'kitchen', [0.461, 1.88, 0.763], [-0.314, -12.246, -17.631]),
  equipAsset('touch_55_holobox.glb', 'Touch 55" голобокс', 'kitchen', [0.689, 2.177, 0.79], [-0.364, -11.966, -11.283]),
  equipAsset('touch_55_table_art.glb', 'Touch 55" стол-арт', 'kitchen', [0.966, 1.022, 2.504], [-0.418, -16.14, -11.206]),
  equipAsset('touch_55_transparency.glb', 'Touch 55" прозрачный', 'kitchen', [0.355, 1.782, 0.766], [-0.246, -12.304, -14.624]),
]

export const CATALOG_ITEMS: AssetInput[] = [
  ...STAND_ITEMS,
  ...EQUIPMENT_STANDS,
  ...EQUIPMENT_SCREENS,
]

export function getDefaultCatalogItem(category: string | null | undefined): AssetInput | null {
  if (!category) return null
  return CATALOG_ITEMS.find((item) => item.category === category) ?? null
}
