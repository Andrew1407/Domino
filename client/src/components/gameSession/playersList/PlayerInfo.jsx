import { applyStylesIf } from '../../../tools';
import { playerBlock, infoEntries, nameInfo, separator, setPlayer, scoreImg, tilesImg } from '../../../styles/gameSession/PlayersList.module.scss';

export default function PlayerInfo({ name, score, tiles, you }) {
  return (
    <div className={playerBlock}>
      <span className={applyStylesIf(you, [nameInfo, setPlayer], [nameInfo])}>
        {name}
        {you && <small> (you) </small>}
        :
      </span>
      <div className={infoEntries}>
        <span>{score}</span>
        <img className={scoreImg} src='/static/score.png' />
      </div>
      <span className={separator}>|</span>
      <div className={infoEntries}>
        <span>{tiles}</span>
        <img className={tilesImg} src='/static/tile.png' />
      </div>
    </div>
  );
};
