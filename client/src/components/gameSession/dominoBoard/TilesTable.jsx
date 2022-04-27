import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCommonDeck, getFirstTile, getPickedTile, getMovePermission, getSessionEmitter } from '../../../storage/selectors';
import { coordsContainer, BOUND_LIMITS } from '../../../canvas/params';
import { makeTilesImgs, checkMoveArea } from '../../../canvas/deck';
import { placeTiles, drawTiles, drawMoveArea, clearMoveArea } from '../../../canvas/drawing';
import { tilesTable } from '../../../styles/gameSession/DominoBoard.module.scss';

const rectState = {
  IDLE_OUTSIDE: 0,
  IDLE_INSIDE: 1,
  SHOULD_CLEAR: 2,
};

export default function TilesTable() {
  const tableCanvas = useRef(null);
  const canvasContainer = useRef(null);
  const [ tileImgs, setTileImgs ] = useState({});
  const [ centerCoords, setCenterCoords ] = useState(coordsContainer());
  const [ offsetCoords, setOffsetCoords ] = useState(coordsContainer());
  const [ dragCoords, setDragCoords ] = useState(coordsContainer());
  const [ mouseBtnDown, setMouseBtnDown ] = useState(false);
  const [ mouseDownCoords, setMouseDownCoords ] = useState(coordsContainer());
  const [ moveArea, setMoveArea ] = useState({ left: null, right: null });
  const [ cursorCoords, setCursorCoords ] = useState(coordsContainer());
  const [ areaDrawState, setAreaDrawState ] = useState(rectState.IDLE_OUTSIDE);
  const deck = useSelector(getCommonDeck);
  const firstTile = useSelector(getFirstTile);
  const pickedTile = useSelector(getPickedTile);
  console.log(deck);
  const movePermission = useSelector(getMovePermission);
  const sessionEmitter = useSelector(getSessionEmitter);
  
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
      const cursor = coordsContainer(e.clientX, e.clientY);
      setDragCoords(cursor);
      setMouseDownCoords({ ...cursor });
      setMouseBtnDown(true);
    };
  }, []);

  useEffect(() => {
    const ctx = tableCanvas.current?.getContext('2d');
    if (!ctx) return;
    const container = canvasContainer.current;
    const refsSet = ctx && container;
    if (!refsSet) return;
    const moveDelta = 6;

    ctx.canvas.onmouseup = e => {
      setMouseBtnDown(false);
      const { x, y } = mouseDownCoords;
      const offsetX = Math.abs(e.clientX - x);
      const offsetY = Math.abs(e.clientY - y);
      if (offsetX > moveDelta || offsetY > moveDelta) return;
      if (!pickedTile) return;
      const { side, permission: ableToMove } = movePermission;
      if (!ableToMove) return;
      const sideParams = moveArea[side];
      
      const canvasRect = tableCanvas.current?.getBoundingClientRect();
      const cursorX = e.clientX - canvasRect.left;
      const cursorY = e.clientY - canvasRect.top;
      
      const { insideArea } = checkMoveArea({
        areaPosition: sideParams,
        cursor: coordsContainer(cursorX, cursorY),
        offset: offsetCoords,
        center: centerCoords,
      });

      if (insideArea) sessionEmitter?.moveAction(side, pickedTile);
    };
  }, [mouseDownCoords, moveArea, movePermission, offsetCoords, centerCoords, sessionEmitter, pickedTile]);

  useEffect(() => {
    const ctx = tableCanvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.canvas.onmousemove = e => {
      const cursor = coordsContainer(e.clientX, e.clientY);
      setCursorCoords(cursor);
      if (mouseBtnDown) {
        const nextOffset = {
          x: offsetCoords.x + dragCoords.x - cursor.x,
          y: offsetCoords.y + dragCoords.y - cursor.y,
        };
        const xMod = Math.abs(nextOffset.x);
        const yMod = Math.abs(nextOffset.y);
        if (xMod < BOUND_LIMITS.x && yMod < BOUND_LIMITS.y)
          setOffsetCoords(nextOffset);
        setDragCoords({ ...cursor });
        return;
      }
      if (!pickedTile) return;
      const { left, right } = moveArea;
      if (!(left && right)) return;
      
      const canvasRect = tableCanvas.current?.getBoundingClientRect();
      const cursorX = cursor.x - canvasRect.left;
      const cursorY = cursor.y - canvasRect.top;
      const idleInsideState = areaDrawState === rectState.IDLE_INSIDE;

      const checkMoveAction = side => {
        const { insideArea } = checkMoveArea({
          areaPosition: moveArea[side],
          cursor: coordsContainer(cursorX, cursorY),
          offset: offsetCoords,
          center: centerCoords,
        });
        if (!insideArea) return false;  
        if (!idleInsideState) {
          sessionEmitter?.checkMoveAction(side, pickedTile);
          setAreaDrawState(rectState.IDLE_INSIDE);
        }
        return true;
      };

      for (const side of ['left', 'right'])
        if (checkMoveAction(side)) return;
      if (idleInsideState) setAreaDrawState(rectState.SHOULD_CLEAR);
    };
  }, [mouseBtnDown, pickedTile, moveArea, centerCoords, areaDrawState]);


  useEffect(() => {
    if (!(deck.length && firstTile)) return;
    const canvasSizeSet = centerCoords.x || centerCoords.y;
    if (!canvasSizeSet) return;
    const ctx = tableCanvas.current?.getContext('2d');
    const container = canvasContainer.current;
    const refsSet = ctx && container;
    if (!refsSet) return;

    const tilesDeck = [ ...deck ];
    if (pickedTile) {
      tilesDeck.push(pickedTile);
      tilesDeck.unshift(pickedTile);
    }
    console.log({ tilesDeck, pickedTile, firstTile });
    const { imgsCoords, moveSides } = placeTiles({ tilesDeck, pickedTile, firstTile });
    
    const imgsEmpty = !Object.keys(tileImgs).length;
    const imgsNextState = imgsEmpty ? makeTilesImgs() : { ...tileImgs };
    for (const key in imgsNextState)
      imgsNextState[key] = { ...imgsNextState[key], ...imgsCoords[key] };
    setTileImgs(imgsNextState);
    setMoveArea(moveSides);
  }, [deck, pickedTile, firstTile]);

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

    drawTiles({ ctx, centerCoords, offsetCoords, tileImgs });

  }, [tileImgs, centerCoords, offsetCoords]);

  useEffect(() => {
    if (!movePermission) return;
    const ctx = tableCanvas.current?.getContext('2d');
    if (!ctx) return;
    const { side, permission: ableToMove } = movePermission;
    const sideParams = moveArea[side];
    
    const canvasRect = tableCanvas.current?.getBoundingClientRect();
    const cursorX = cursorCoords.x - canvasRect.left;
    const cursorY = cursorCoords.y - canvasRect.top;

    const { rectParams } = checkMoveArea({
      areaPosition: sideParams,
      cursor: coordsContainer(cursorX, cursorY),
      offset: offsetCoords,
      center: centerCoords,
    });

    if (!rectParams) return;
    drawMoveArea({ ctx, rectParams, ableToMove })
    setAreaDrawState(rectState.IDLE_INSIDE);

  }, [movePermission]);

  useEffect(() => {
    if (areaDrawState !== rectState.SHOULD_CLEAR) return;
    setAreaDrawState(rectState.IDLE_OUTSIDE);

    const ctx = tableCanvas.current?.getContext('2d');
    if (!ctx) return;
    if (!movePermission) return;

    const { side } = movePermission;
    const sideParams = moveArea[side];

    const canvasRect = tableCanvas.current?.getBoundingClientRect();
    const cursorX = cursorCoords.x - canvasRect.left;
    const cursorY = cursorCoords.y - canvasRect.top;

    const { rectParams } = checkMoveArea({
      areaPosition: sideParams,
      cursor: coordsContainer(cursorX, cursorY),
      offset: offsetCoords,
      center: centerCoords,
    });

    if (rectParams) clearMoveArea({ ctx, rectParams });

  }, [areaDrawState]);

  return (
    <div ref={canvasContainer} className={tilesTable}>
      <canvas ref={tableCanvas}></canvas>
    </div>
  );
};
