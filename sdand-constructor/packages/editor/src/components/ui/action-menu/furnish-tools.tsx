import type { CatalogCategory } from './../../../store/use-editor'

export type FurnishToolConfig = {
  id: 'item'
  iconSrc: string
  label: string
  catalogCategory: CatalogCategory
}

export const furnishTools: FurnishToolConfig[] = [
  { id: 'item', iconSrc: '/icons/couch.png', label: 'Стенды', catalogCategory: 'furniture' },
  { id: 'item', iconSrc: '/icons/appliance.png', label: 'Оборудование', catalogCategory: 'appliance' },
  { id: 'item', iconSrc: '/icons/kitchen.png', label: 'Кухня', catalogCategory: 'kitchen' },
  { id: 'item', iconSrc: '/icons/bathroom.png', label: 'Санузел', catalogCategory: 'bathroom' },
  { id: 'item', iconSrc: '/icons/tree.png', label: 'Улица', catalogCategory: 'outdoor' },
]
