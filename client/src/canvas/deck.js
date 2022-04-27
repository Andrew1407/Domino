import { coordsContainer, DEFAULT_COORD, TILE_SIZE } from './params';
import { getTileImagePath } from '../tools';

export const makeTilesImgs = () => {
  const maxTileValue = 6;
  const rotation = 0;
  const defaultParams = {
    ...coordsContainer(DEFAULT_COORD, DEFAULT_COORD),
    rotation,
  };
  const tilesDeck = {};
  for (let left = 0; left <= maxTileValue; ++left) 
    for (let right = 0; right <= left; ++right) {
      const key = [left, right].join('-');
      const img = new Image();
      img.src = getTileImagePath({ left, right });
      tilesDeck[key] = { img, ...defaultParams };
    }
  return tilesDeck;
};

export const checkMoveArea = ({ areaPosition, cursor, offset, center }) => {
  const { x, y, rotation } = areaPosition;
  const rotHorizontal = Math.abs(rotation) === 90;
  const width = rotHorizontal ? TILE_SIZE.height : TILE_SIZE.width;
  const height = rotHorizontal ? TILE_SIZE.width: TILE_SIZE.height;
  const xt = x + offset.x + center.x - width / 2;
  const yt = y + offset.y + center.y - height / 2;

  const fitsX = cursor.x >= xt && cursor.x <= xt + width;
  const fitsY = cursor.y >= yt && cursor.y <= yt + height;

  return {
    insideArea: fitsX && fitsY,
    rectParams: [xt, yt, width, height],
  };
};

export const groupTilesBySide = (deck, containerLengths, iterator) => {
  const containers = [];
  for (let i = 0; i < containerLengths.length; ++i) {
    if (iterator.outOfLimit(deck.length)) break;
    const size = containerLengths[i];
    const limitNext = iterator.next(size);
    const containerBounds = iterator.containerBounds(limitNext);
    const container = deck.slice(...containerBounds);
    containers.push(container);
    iterator.limit = limitNext;
  }
  return containers;
};
