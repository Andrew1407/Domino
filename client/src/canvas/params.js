export const DEFAULT_COORD = 10000;

export const coordsContainer = (x = 0, y = 0) => ({ x, y });

export const TILE_SIZE = {
  width: 64,
  height: 122,
};

export const BOUND_LIMITS = coordsContainer(800, 1000);

export const ROTATION_TRANSFORMER = {
  [0]: (x, y) => coordsContainer(x, y),
  [90]: (x, y) => coordsContainer(y, -x),
  [-90]: (x, y) => coordsContainer(-y, x),
  [180]: (x, y) => coordsContainer(x, -y),
  [-180]: (x, y) => coordsContainer(-x, -y),
};
