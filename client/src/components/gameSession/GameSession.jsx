import MainWrapper from '../main/MainWrapper';
import HeaderInfoBar from './headerInfo/HeaderInfoBar';
import PlayersList from './playersList/PlayersList';
import LogTitle from './historyLog/LogTitle';
import HistoryLog from './historyLog/HistoryLog';
import DominoBoard from './dominoBoard/DominoBoard';
import PlayerDeck from './playerDeck/PlayerDeck';
import { sessionEntriesBlock } from '../../styles/gameSession/GameSession.module.scss';

export default function GameSession() {
  return (
    <MainWrapper HeaderInfo={HeaderInfoBar}>
      <div className={sessionEntriesBlock}>
        <PlayersList />
        <LogTitle />
        <HistoryLog />
        <DominoBoard />
        <PlayerDeck />
      </div>
    </MainWrapper>
  );
};
