import { TILE_SIZE } from './params';

const directionParams = {
  left: {
    axis: 'x',
    coef: -1,
    rotationAgle: 90,
  },
  right: {
    axis: 'x',
    coef: 1,
    rotationAgle: 90,
  },
  down: {
    axis: 'y',
    coef: 1,
    rotationAgle: 0,
  },
  up: {
    axis: 'y',
    coef: -1,
    rotationAgle: 0,
  },
};

const nextTilePosition = ({ tileSize, position, deck, direction, i, prev }) => {
  const { axis, coef, rotationAgle } = directionParams[direction];
  const tileCur = deck[i];
  const prevIdx = i + prev;
  const tilePrev = deck[prevIdx];

  const isDoubleCur = tileCur.right === tileCur.left;
  const isDoublePrev = tilePrev.left === tilePrev.right;

  const offset = isDoublePrev || isDoubleCur ?
    tileSize.width + tileSize.height * 0.25 :
    tileSize.height;

  position[axis] += offset * coef;

  const verticalDir = ['down', 'up'].includes(direction);
  const prevFirst = prevIdx === 0;
  if (verticalDir && prevFirst && isDoublePrev)
    position[axis] += tileSize.height * 0.25 * coef;
  
  const newPosition = { ...position, rotation: rotationAgle };
  
  if (isDoubleCur)
    newPosition.rotation -= 90;
  else if (tileCur.left > tileCur.right)
    newPosition.rotation -= 180;

  return newPosition;
};

const cornerPosition = ({ tileSize, tile, position, direction, previous }) => {
  const { tile: prevTile, direction: prevDir } = previous;
  const prevDouble = prevTile.left === prevTile.right;
  let rotation = 0;
  const verticalDir = ['down', 'up'].includes(direction);
  const horizontalDir = ['left', 'right'].includes(direction);
  if (verticalDir) {
    const coefX = prevDir === 'left' ? -1 : 1;
    const coefY = direction === 'up' ? -1 : 1;
    if (prevDouble) {
      position.x += tileSize.width * coefX;
      position.y += tileSize.height * 0.5 * coefY;
    } else {
      position.x += tileSize.height * 0.75 * coefX;
      position.y += tileSize.height * 0.25 * coefY;
    }
  } else if (horizontalDir) {
    let coefX = 1;
    let coefY = 1;

    if (prevDir === 'left' || direction === 'left') coefX = -1;
    if (prevDir === 'up' || direction === 'up') coefY = -1;

    rotation = 90;
    if (prevDouble) {
      position.x += tileSize.height * coefX;
    } else {
      position.x += tileSize.height * 0.75 * coefX;
      position.y += tileSize.height * 0.25 * coefY;
    }
  }

  if (tile.left < tile.right) rotation -= 180;
  const nextPosition = { ...position, rotation };

  return nextPosition;
};

export const defineSidePositions = (sideParams, tilesIterator, prevNext) => {
  const { containers, directions, firstTile, boundIdx, startPosition } = sideParams;
  for (let i = 0, prev = firstTile; i < containers.length; ++i) {
    const tiles = containers[i];
    const direction = directions[i];
    const firstContainer = i === 0;
    const posArgs = {
      direction,
      tileSize: TILE_SIZE,
      position: startPosition,
    };
    tilesIterator(tiles, (u, isPivotTile) => {
      const curTile = tiles[u];
      const previous = { tile: prev, direction: directions[i - 1] };
      let position;
      if (firstContainer && isPivotTile)
        position = nextTilePosition({ ...posArgs, deck: [curTile, firstTile], i: 0, prev: 1 });
      else if (isPivotTile)
        position = cornerPosition({ ...posArgs, tile: curTile, previous });
      else
        position = nextTilePosition({ ...posArgs, deck: tiles, i: u, prev: boundIdx });
      return position;
    });
    
    prev = prevNext(tiles);
  }
};
