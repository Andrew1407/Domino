import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getPickedTile, getPlayerDeck, getRoundInfo, getSessionEmitter } from '../../../storage/selectors';
import { getTileImagePath, tilesEqual } from '../../../tools';
import { setPickedTile } from '../../../storage/actions/pickedTile'
import { deckContainer, stockBtn, tilesContainer, tileContainer, pickedTileContainer } from '../../../styles/gameSession/PlayerDeck.module.scss';

export default function PlayerDeck() {
  const dispatch = useDispatch();
  const { stock } = useSelector(getRoundInfo);
  const deck = useSelector(getPlayerDeck);
  const pickedTile = useSelector(getPickedTile);
  const sessionEmitter = useSelector(getSessionEmitter);

  const pickTile = useCallback(tile => {
    if (tilesEqual(tile, pickedTile)) return;
    dispatch(setPickedTile(tile));
  }, [pickedTile]);

  const fromStock = useCallback(() => {
    sessionEmitter.takeFromStock();
  }, [sessionEmitter]);

  return (
    <div className={deckContainer}>
      <button className={stockBtn} onClick={fromStock}>
        Get from stock <b>({stock})</b>
      </button>

      <div className={tilesContainer}>
        {deck.map(t => (
          <img
            className={tilesEqual(pickedTile, t) ? pickedTileContainer : tileContainer }
            onClick={() => pickTile(t)}
            key={JSON.stringify(t)}
            src={getTileImagePath(t)}
          />
        ))}
      </div>
    </div>
  )
}
