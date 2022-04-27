export const sideIteratorFactory = {
  left: limit => ({
    limit,
    outOfLimit() {
      return this.limit <= 0;
    },
    next(size) {
      return this.limit - size;
    },
    containerBounds(next) {
      return [next < 0 ? 0 : next, this.limit];
    },
  }),

  right: limit => ({
    limit,
    outOfLimit(comparable) {
      return this.limit >= comparable;
    },
    next(size) {
      return this.limit + size;
    },
    containerBounds(next) {
      return [this.limit, next];
    },
  }),
};


export const directionIteratorFactory = {
  left: posSaver => (tiles, posSearch) => {
    for (let u = tiles.length - 1; u >= 0; --u) {
      const lastTile = u === tiles.length - 1;
      const position = posSearch(u, lastTile);
      posSaver(position, tiles[u]);
    }
  },

  right: posSaver => (tiles, posSearch) => {
    for (let u = 0; u < tiles.length; ++u) {
      const firstTile = u === 0;
      const position = posSearch(u, firstTile);
      posSaver(position, tiles[u]);
    }
  },
};
