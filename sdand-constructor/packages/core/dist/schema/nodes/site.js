// lib/scenegraph/schema/nodes/site.ts
import dedent from 'dedent';
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from '../base';
// 2D Polygon
const PropertyLineData = z.object({
    type: z.literal('polygon'),
    points: z.array(z.tuple([z.number(), z.number()])),
});
// 3D Polygon/Mesh
// const TerrainData = z.object({
//   type: z.literal('terrain'),
//   points: z.array(z.tuple([z.number(), z.number(), z.number()])),
// })
export const SiteNode = BaseNode.extend({
    id: objectId('site'),
    type: nodeType('site'),
    // Specific props
    // Sdand: property-line disabled by default. Пустой polygon → renderers
    // skip site outline / edge labels / 2D dashed rectangle.
    polygon: PropertyLineData.optional().default({
        type: 'polygon',
        points: [],
    }),
    // terrain: TerrainData,
    children: z.array(z.string()).default([]),
}).describe(dedent `
  Site node - used to represent a site
  - polygon: polygon data
  - children: array of child node ids (buildings, items)
  `);
