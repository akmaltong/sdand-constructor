import type { AssetInput } from '@pascal-app/core'

// Sdand-конструктор: каталог заменён на набор кубов-стендов разных размеров и
// цветов. src = `primitive:box:<hex>` — маркер, который ItemRenderer
// перехватывает и рисует boxGeometry напрямую, минуя useGLTF. thumbnail =
// inline SVG data-URL заливкой цветом (без сетевых запросов).

type StandSpec = {
  id: string
  name: string
  /** [width, height, depth] в метрах */
  size: [number, number, number]
  /** hex-цвет без #, например `ef4444` */
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

export const CATALOG_ITEMS: AssetInput[] = STANDS.map((s) => ({
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

export function getDefaultCatalogItem(category: string | null | undefined): AssetInput | null {
  if (!category) return null
  return CATALOG_ITEMS.find((item) => item.category === category) ?? null
}
