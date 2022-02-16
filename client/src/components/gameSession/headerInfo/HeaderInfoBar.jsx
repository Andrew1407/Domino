import { useSelector } from 'react-redux';
import { getRoundInfo, getSessionId, getWaitForPlayers } from '../../../storage/selectors';
import SessionContainer from './SessionContainer';
import { headerInfoContainer, infoEntry, infoEntryBordered } from '../../../styles/gameSession/HeaderInfo.module.scss';

export default function HeaderInfoBar() {
  const waitForPlayers = useSelector(getWaitForPlayers);
  const roundInfo = useSelector(getRoundInfo);
  const sessionId = useSelector(getSessionId);

  return (
    <div className={headerInfoContainer}>
      <p className={infoEntryBordered}>Final score:
        <span> {roundInfo.finalScore}</span>
      </p>

      <p className={infoEntryBordered}>Players:
        <span> {roundInfo.players}</span>
      </p>

      {waitForPlayers ?
        <SessionContainer id={sessionId} /> :
        <p className={infoEntry}>Current round: 
          <span> {roundInfo.currentRound}</span>
        </p>
      }
    </div>
  );
}
