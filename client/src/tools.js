export const applyStyles = (...styles) => styles.join(' ');

export const applyStylesIf = (condition, truthy, falsy) => (
  applyStyles(...(condition ? truthy : falsy))
);

export const getTileImage = ({ left, right }) => {
  const name = left >= right ?
    `${left}-${right}` :
    `${right}-${left}`;
  return `/static/tiles/${name}.svg`;
};
