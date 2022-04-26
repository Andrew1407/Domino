export const applyStyles = (...styles) => styles.join(' ');

export const applyStylesIf = (condition, truthy, falsy) => (
  applyStyles(...(condition ? truthy : falsy))
);

export const getTileKey = ({ left, right }) => (
  left >= right ? `${left}-${right}` : `${right}-${left}`
);

export const getTileImagePath = tile => `/static/tiles/${getTileKey(tile)}.svg`;

export const tilesEqual = (first, second) => {
  if (!(first && second)) return false;
  return first.left === second.left &&
    first.right === second.right;
};
