import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getPickedTile, getPlayerDeck, getRoundInfo } from '../../../storage/selectors';
import { deckContainer, stockBtn, tilesContainer, tileContainer, pickedTileContainer } from '../../../styles/gameSession/PlayerDeck.module.scss';
import { getTileImage } from '../../../tools';
import { setPickedTile } from '../../../storage/actions/pickedTile'

const tilesEqual = (first, second) => {
  if (!(first && second)) return false;
  return first.left === second.left &&
    first.right === second.right;
};

export default function PlayerDeck() {
  const dispatch = useDispatch();
  const { stock } = useSelector(getRoundInfo);
  const deck = useSelector(getPlayerDeck);
  const pickedTile = useSelector(getPickedTile);
  
  const pickTile = useCallback(tile => {
    if (tilesEqual(tile, pickedTile)) return;
    dispatch(setPickedTile(tile));
  }, [pickedTile]);

  return (
    <div className={deckContainer}>
      <input
        type="button"
        className={stockBtn}
        value={`Get from stock (${stock})`}
      />

      <div className={tilesContainer}>
        {deck.map(t => (
          <img
            className={tilesEqual(pickedTile, t) ? pickedTileContainer : tileContainer }
            onClick={() => pickTile(t)}
            key={JSON.stringify(t)}
            src={getTileImage(t)}
          />
        ))}
      </div>
    </div>
  )
}
