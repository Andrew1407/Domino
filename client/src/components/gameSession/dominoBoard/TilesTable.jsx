import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTileImagePath, getTileKey, tilesEqual } from '../../../tools';
import { getCommonDeck, getFirstTile } from '../../../storage/selectors';
import { tilesTable } from '../../../styles/gameSession/DominoBoard.module.scss';

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

const nextTilePosition = (tileSize, positionIterable, deck, direction, i, prev) => {
  const { axis, coef, rotationAgle } = directionParams[direction];
  const tileCur = deck[i];
  const prevIdx = i + prev;
  const tilePrev = deck[prevIdx];

  const isDoubleCur = tileCur.right === tileCur.left;
  const isDoublePrev = tilePrev.left === tilePrev.right;

  const offset = isDoublePrev || isDoubleCur ?
    tileSize.width + tileSize.height * 0.25 :
    tileSize.height;

  positionIterable[axis] += offset * coef;

  const verticalDir = ['down', 'up'].includes(direction);
  const prevFirst = prevIdx === 0;
  if (verticalDir && prevFirst && isDoublePrev)
    positionIterable[axis] += tileSize.height * 0.25 * coef;
  
  const position = { ...positionIterable, rotation: rotationAgle };
  
  if (isDoubleCur)
    position.rotation -= 90;
  else if (tileCur.left > tileCur.right)
    position.rotation -= 180;

  return position;
};



const cornerPosition = (tileSize, tile, positionIterable, direction, previous) => {
  const { tile: prevTile, direction: prevDir } = previous;
  const prevDouble = prevTile.left === prevTile.right;
  let rotation = 0;
  const verticalDir = ['down', 'up'].includes(direction);
  const horizontalDir = ['left', 'right'].includes(direction);
  if (verticalDir) {
    const coefX = prevDir === 'left' ? -1 : 1;
    const coefY = direction === 'up' ? -1 : 1;
    if (prevDouble) {
      positionIterable.x += tileSize.width * coefX;
      positionIterable.y += tileSize.height * 0.5 * coefY;
    } else {
      positionIterable.x += tileSize.height * 0.75 * coefX;
      positionIterable.y += tileSize.height * 0.25 * coefY;
    }
  } else if (horizontalDir) {
    let coefX = 1;
    let coefY = 1;

    if (prevDir === 'left' || direction === 'left') coefX = -1;
    if (prevDir === 'up' || direction === 'up') coefY = -1;

    rotation = 90;
    if (prevDouble) {
      positionIterable.x += tileSize.height * coefX;
    } else {
      positionIterable.x += tileSize.height * 0.75 * coefX;
      positionIterable.y += tileSize.height * 0.25 * coefY;
    }
  }

  if (tile.left < tile.right) rotation -= 180;
  const position = { ...positionIterable, rotation };

  return position;
};


const defaultCoord = 10000;
const sizeCoef = 1;
const tileSize = {
  width: 64 / sizeCoef,
  height: 122 / sizeCoef,
};
const coordContainer = (x = 0, y = 0) => ({ x, y });

const boundLimit = coordContainer(800, 1000);

const coordsRotated = {
  [0]: (x, y) => coordContainer(x, y),
  [90]: (x, y) => coordContainer(y, -x),
  [-90]: (x, y) => coordContainer(-y, x),
  [180]: (x, y) => coordContainer(x, -y),
  [-180]: (x, y) => coordContainer(-x, -y),
};

const makeTilesImgs = () => {
  const maxTileValue = 6;
  const rotation = 0;
  const defaultParams = {
    ...coordContainer(defaultCoord, defaultCoord),
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

export default function TilesTable() {
  const tableCanvas = useRef(null);
  const canvasContainer = useRef(null);
  const [ tileImgs, setTileImgs ] = useState({});
  const [ centerCoords, setCenterCoords ] = useState(coordContainer());
  const [ offsetCoords, setOffsetCoords ] = useState(coordContainer());
  const [ dragCoords, setDragCoords ] = useState(coordContainer());
  const [ mouseBtnDown, setMouseBtnDown ] = useState(false);
  const deck = useSelector(getCommonDeck);
  const firstTile = useSelector(getFirstTile);

  useEffect(() => {
    const ctx = tableCanvas.current?.getContext('2d');
    const container = canvasContainer.current;
    const refsSet = ctx && container;
    if (!refsSet) return;
    window.onresize = () => {
      ctx.canvas.height = container.clientHeight;
      ctx.canvas.width = container.clientWidth;
      const center = {
        x: container.clientWidth / 2,
        y: container.clientHeight / 2,
      };
      setCenterCoords(center);
    };
    window.onresize();

    ctx.canvas.onmousedown = e => {
      setDragCoords({ x: e.clientX, y: e.clientY });
      setMouseBtnDown(true);
    };

    ctx.canvas.onmouseup = () => setMouseBtnDown(false);
  }, []);

  useEffect(() => {
    const ctx = tableCanvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.canvas.onmousemove = e => {
      if (!mouseBtnDown) return;
      const nextOffset = {
        x: offsetCoords.x + dragCoords.x - e.clientX,
        y: offsetCoords.y + dragCoords.y - e.clientY,
      };
      const xMod = Math.abs(nextOffset.x);
      const yMod = Math.abs(nextOffset.y);
      if (xMod < boundLimit.x && yMod < boundLimit.y)
        setOffsetCoords(nextOffset);
      setDragCoords({ x: e.clientX, y: e.clientY });
    };
  }, [mouseBtnDown]);

  useEffect(() => {
    if (!deck.length) return;
    const canvasSizeSet = centerCoords.x || centerCoords.y;
    if (!canvasSizeSet) return;
    const ctx = tableCanvas.current?.getContext('2d');
    const container = canvasContainer.current;
    const refsSet = ctx && container;
    if (!refsSet) return;

    const firstTileIdx = deck.findIndex(t => tilesEqual(t, firstTile));
    const containerLengths = [4, 5, 9, 5, 4];
    const containersLeft = [];

    for (let i = 0, end = firstTileIdx; i < containerLengths.length; ++i) {
      if (end <= 0) break;
      const size = containerLengths[i];
      const start = end - size;
      const container = deck.slice(start < 0 ? 0 : start, end);
      containersLeft.push(container);
      end = start;
    }
    const containersRight = [];
    for (let i = 0, start = firstTileIdx + 1; i < containerLengths.length; ++i) {
      if (start >= deck.length) break;
      const size = containerLengths[i];
      const end = start + size;
      const container = deck.slice(start, end);
      containersRight.push(container);
      start = end;
    }

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

    const imgsCoords = {};
    // drawing first tile
    imgsCoords[getTileKey(firstTile)] = coordContainer();
    const positionLeft = coordContainer();

    let prev = firstTile;
    for (let i = 0; i < containersLeft.length; ++i) {
      const tiles = containersLeft[i];
      const direction = leftDirections[i];
      const firstContainer = i === 0;
      for (let u = tiles.length - 1; u >= 0; --u) {
        const lastTile = u === tiles.length - 1;
        if (firstContainer && lastTile) {
          const position = nextTilePosition(tileSize, positionLeft, [tiles[u], firstTile], direction, 0, 1);
          imgsCoords[getTileKey(tiles[u])] = position;
        } else if (lastTile) {
          const position = cornerPosition(tileSize,tiles[u], positionLeft, direction, {
            tile: prev,
            direction: leftDirections[i - 1],
          });
          imgsCoords[getTileKey(tiles[u])] = position;
        } else {
          const position = nextTilePosition(tileSize, positionLeft, tiles, direction, u, 1, deck);
          imgsCoords[getTileKey(tiles[u])] = position;
        }
      }
      prev = tiles[0];
    }

    const positionRight = coordContainer();
    prev = firstTile;
    for (let i = 0; i < containersRight.length; ++i) {
      const tiles = containersRight[i];
      const direction = rightDirections[i];
      const firstContainer = i === 0;
      for (let u = 0; u < tiles.length; ++u) {
        const firstTile = u === 0;
        if (firstContainer && firstTile) {
          const position = nextTilePosition(tileSize, positionRight, [tiles[u], firstTile], direction, 0, 1);
          imgsCoords[getTileKey(tiles[u])] = position;
        } else if (firstTile) {
          const position = cornerPosition(tileSize, tiles[u], positionRight, direction, {
            tile: prev,
            direction: rightDirections[i - 1],
          });
          imgsCoords[getTileKey(tiles[u])] = position;
        } else {
          const position = nextTilePosition(tileSize, positionRight, tiles, direction, u, -1);
          imgsCoords[getTileKey(tiles[u])] = position;
        }
      }
      prev = tiles[tiles.length - 1];
    }

    const imgsEmpty = !Object.keys(tileImgs).length;
    const imgsNextState = imgsEmpty ? makeTilesImgs() : { ...tileImgs };
    for (const key in imgsNextState)
      imgsNextState[key] = { ...imgsNextState[key], ...imgsCoords[key] };
    setTileImgs(imgsNextState);
  }, [deck]);

  useEffect(() => {
    const imgsEmpty = !Object.keys(tileImgs).length;
    if (imgsEmpty) return;
    if (!deck.length) return;
    const canvasSizeSet = centerCoords.x || centerCoords.y;
    if (!canvasSizeSet) return;
    const ctx = tableCanvas.current?.getContext('2d');
    const container = canvasContainer.current;
    const refsSet = ctx && container;
    if (!refsSet) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const key in tileImgs) {
      const { img, x, y, rotation } = tileImgs[key];
      if (x === defaultCoord && y === defaultCoord) continue;
      const { x: xt, y: yt } = coordsRotated[rotation](x + offsetCoords.x, y + offsetCoords.y);
      const tileX =  centerCoords.x + xt - tileSize.width / 2;
      const tileY =  centerCoords.y + yt - tileSize.height / 2;
      img.onload = () => {
        ctx.save();
        ctx.translate(centerCoords.x, centerCoords.y);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-centerCoords.x, -centerCoords.y);
        ctx.drawImage(img, tileX, tileY, tileSize.width, tileSize.height);
        ctx.restore();
      };
      img.onload();
    }

  }, [tileImgs, centerCoords, offsetCoords]);

  return (
    <div ref={canvasContainer} className={tilesTable}>
      <canvas ref={tableCanvas}></canvas>
    </div>
  );
};
