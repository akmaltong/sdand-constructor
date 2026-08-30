export class SpatialGrid {
    cells = new Map();
    itemCells = new Map(); // reverse lookup
    itemBounds = new Map(); // actual AABB for narrow-phase
    config;
    constructor(config) {
        this.config = config;
    }
    posToCell(x, z) {
        return [Math.floor(x / this.config.cellSize), Math.floor(z / this.config.cellSize)];
    }
    cellKey(cx, cz) {
        return `${cx},${cz}`;
    }
    // Compute the axis-aligned bounding box for a rotated item
    getAABB(position, dimensions, rotation) {
        const [x, , z] = position;
        const [w, , d] = dimensions;
        const yRot = rotation[1];
        const cos = Math.abs(Math.cos(yRot));
        const sin = Math.abs(Math.sin(yRot));
        const rotatedW = w * cos + d * sin;
        const rotatedD = w * sin + d * cos;
        return {
            minX: x - rotatedW / 2,
            maxX: x + rotatedW / 2,
            minZ: z - rotatedD / 2,
            maxZ: z + rotatedD / 2,
        };
    }
    // Get all cells an item occupies based on its AABB
    getItemCells(bounds) {
        const { minX, maxX, minZ, maxZ } = bounds;
        const [minCx, minCz] = this.posToCell(minX, minZ);
        const [maxCx, maxCz] = this.posToCell(maxX, maxZ);
        const keys = [];
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cz = minCz; cz <= maxCz; cz++) {
                keys.push(this.cellKey(cx, cz));
            }
        }
        return keys;
    }
    // Register an item
    insert(itemId, position, dimensions, rotation) {
        const bounds = this.getAABB(position, dimensions, rotation);
        const cellKeys = this.getItemCells(bounds);
        this.itemCells.set(itemId, new Set(cellKeys));
        this.itemBounds.set(itemId, bounds);
        for (const key of cellKeys) {
            if (!this.cells.has(key)) {
                this.cells.set(key, { itemIds: new Set() });
            }
            this.cells.get(key)?.itemIds.add(itemId);
        }
    }
    // Remove an item
    remove(itemId) {
        const cellKeys = this.itemCells.get(itemId);
        if (!cellKeys)
            return;
        for (const key of cellKeys) {
            const cell = this.cells.get(key);
            if (cell) {
                cell.itemIds.delete(itemId);
                if (cell.itemIds.size === 0) {
                    this.cells.delete(key);
                }
            }
        }
        this.itemCells.delete(itemId);
        this.itemBounds.delete(itemId);
    }
    // Update = remove + insert
    update(itemId, position, dimensions, rotation) {
        this.remove(itemId);
        this.insert(itemId, position, dimensions, rotation);
    }
    // Query: is this placement valid?
    // Uses cells as broad-phase, then checks actual AABB overlap (narrow-phase)
    // to avoid false positives when adjacent items share a cell but don't overlap.
    canPlace(position, dimensions, rotation, ignoreIds = []) {
        const bounds = this.getAABB(position, dimensions, rotation);
        const cellKeys = this.getItemCells(bounds);
        const ignoreSet = new Set(ignoreIds);
        // Broad phase: collect candidate items from overlapping cells
        const candidates = new Set();
        for (const key of cellKeys) {
            const cell = this.cells.get(key);
            if (cell) {
                for (const id of cell.itemIds) {
                    if (!ignoreSet.has(id)) {
                        candidates.add(id);
                    }
                }
            }
        }
        // Narrow phase: check actual AABB overlap
        // Items that merely touch (share an edge) are allowed; only true overlap conflicts.
        const EPSILON = 1e-4; // tolerance to allow touching
        const conflicts = [];
        for (const id of candidates) {
            const other = this.itemBounds.get(id);
            if (!other)
                continue;
            if (bounds.minX < other.maxX - EPSILON &&
                bounds.maxX > other.minX + EPSILON &&
                bounds.minZ < other.maxZ - EPSILON &&
                bounds.maxZ > other.minZ + EPSILON) {
                conflicts.push(id);
            }
        }
        return {
            valid: conflicts.length === 0,
            conflictIds: conflicts,
        };
    }
    // Query: get all items near a point (for snapping, selection, etc.)
    queryRadius(x, z, radius) {
        const cellRadius = Math.ceil(radius / this.config.cellSize);
        const [cx, cz] = this.posToCell(x, z);
        const found = new Set();
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                const cell = this.cells.get(this.cellKey(cx + dx, cz + dz));
                if (cell) {
                    for (const id of cell.itemIds) {
                        found.add(id);
                    }
                }
            }
        }
        return [...found];
    }
    getItemCount() {
        return this.itemCells.size;
    }
}
