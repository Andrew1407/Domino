import Image from 'next/image';
import { applyStylesIf } from '../../../tools';
import { playerBlock, infoEntries, nameInfo, separator, setPlayer } from '../../../styles/gameSession/PlayersList.module.scss';

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
        <Image src='/static/score.png' width={30} height={30} />
      </div>
      <span className={separator}>|</span>
      <div className={infoEntries}>
        <span>{tiles}</span>
        <Image src='/static/tile.png' width={20} height={30} />
      </div>
    </div>
  );
};
