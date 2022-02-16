import { useSelector } from 'react-redux';
import PlayerInfo from './PlayerInfo';
import { getJoinedPlayers } from '../../../storage/selectors';
import { playersListContainer } from '../../../styles/gameSession/PlayersList.module.scss';

export default function PlayersList() {
  const players = useSelector(getJoinedPlayers);

  return (
    <div className={playersListContainer}>
      {players.map(p => <PlayerInfo key={p.name} {...p} />)}
    </div>
  )
}
