import { tilesEqual, getTileKey } from '../tools';
import { coordsContainer, ROTATION_TRANSFORMER, DEFAULT_COORD, TILE_SIZE } from './params';
import { sideIteratorFactory, directionIteratorFactory } from './iteartors';
import { defineSidePositions } from './tilePosition';
import { groupTilesBySide } from './deck';

const leftDirections = [
  'left',
  'down',
  'right',
  'down',
  'left',
];

const rightDirections = [
  'right',
  'up',
  'left',
  'up',
  'right',
];

const containerLengths = [4, 5, 9, 5, 4];

const makePositionSaver = ({ pickedTile, saveTilePos, saveAreaPos }) => (pos, tile) => {
  const margin = tilesEqual(tile, pickedTile);
  if (margin) saveAreaPos(pos);
  else saveTilePos(pos, getTileKey(tile));
}

const directionTileSetter = {
  left: ts => ts[0],
  right: ts => ts[ts.length - 1],
};

export const placeTiles = ({ tilesDeck, pickedTile, firstTile }) => {
  const firstTileIdx = tilesDeck.findIndex(t => tilesEqual(t, firstTile));
  const imgsCoords = {};
  const moveSides = { left: null, right: null };
  const sideLimit = {
    left: firstTileIdx,
    right: firstTileIdx + 1,
  };
  const sideParams = {
    left: {
      firstTile,
      startPosition: coordsContainer(),
      directions: leftDirections,
      boundIdx: 1,
    },
    right: {
      firstTile,
      startPosition: coordsContainer(),
      directions: rightDirections,
      boundIdx: -1,
    },
  };

  const posSaver = side => makePositionSaver({
    pickedTile,
    saveTilePos: (pos, key) => imgsCoords[key] = pos,
    saveAreaPos: pos => moveSides[side] = pos,
  });

  imgsCoords[getTileKey(firstTile)] = coordsContainer();

  for (const side of ['left', 'right']) {
    const limit = sideLimit[side];
    const sideIterator = sideIteratorFactory[side](limit);
    const containers = groupTilesBySide(tilesDeck, containerLengths, sideIterator);
    const params = { ...sideParams[side], containers };
    const saver = posSaver(side);
    const directionIterator = directionIteratorFactory[side](saver);
    const tileSetter = directionTileSetter[side];
    defineSidePositions(params, directionIterator, tileSetter);
  }

  return { imgsCoords, moveSides };
};

export const drawTiles = ({ ctx, centerCoords, offsetCoords, tileImgs }) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const key in tileImgs) {
    const { img, x, y, rotation } = tileImgs[key];
    if (x === DEFAULT_COORD && y === DEFAULT_COORD) continue;
    const transformer = ROTATION_TRANSFORMER[rotation];
    const { x: xt, y: yt } = transformer(x + offsetCoords.x, y + offsetCoords.y);
    const tileX = centerCoords.x + xt - TILE_SIZE.width / 2;
    const tileY = centerCoords.y + yt - TILE_SIZE.height / 2;
    img.onload = () => {
      ctx.save();
      ctx.translate(centerCoords.x, centerCoords.y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-centerCoords.x, -centerCoords.y);
      ctx.drawImage(img, tileX, tileY, TILE_SIZE.width, TILE_SIZE.height);
      ctx.restore();
    };
    img.onload();
  }
};

export const drawMoveArea = ({ ctx, ableToMove, rectParams }) => {
  const rgb = ableToMove ? '225,225,225' : '225,0,0';
  ctx.fillStyle = `rgba(${rgb},0.75)`;
  ctx.fillRect(...rectParams);
};

export const clearMoveArea = ({ ctx, rectParams }) => {
  ctx.clearRect(...rectParams);
};
