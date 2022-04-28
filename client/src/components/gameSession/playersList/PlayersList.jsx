import { useSelector } from 'react-redux';
import PlayerInfo from './PlayerInfo';
import { getJoinedPlayers, getCurentPlayer } from '../../../storage/selectors';
import { playersListContainer } from '../../../styles/gameSession/PlayersList.module.scss';

export default function PlayersList() {
  const players = useSelector(getJoinedPlayers);
  const currentPlayer = useSelector(getCurentPlayer);

  return (
    <div className={playersListContainer}>
      {players.map(p => <PlayerInfo key={p.name} {...p} you={p.name === currentPlayer} />)}
    </div>
  )
}
