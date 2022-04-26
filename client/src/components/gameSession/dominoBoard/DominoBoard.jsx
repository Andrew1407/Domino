import { useSelector } from 'react-redux';
import { getWaitForPlayers } from '../../../storage/selectors';
import ConnectionLoading from './ConnectionLoading';
import TilesTable from './TilesTable';
import { boardContainer } from '../../../styles/gameSession/DominoBoard.module.scss';

export default function DominoBoard() {
  const waitForPlayers = useSelector(getWaitForPlayers);
  
  return (
    <div className={boardContainer}>
      {!waitForPlayers ?
        <ConnectionLoading /> :
        <TilesTable />
      }
    </div>
  )
}
