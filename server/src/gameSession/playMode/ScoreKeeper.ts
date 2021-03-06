import { PlayerName } from '../entities/Player';
import { PlayersDecks } from './PlayMode';

export type PlayersScore = Partial<Record<PlayerName, number>>;

export default interface ScoreKeeper {
  roundSumUp(
    playersDecks: PlayersDecks,
    currentScore: PlayersScore
  ): PlayersScore;

  checkWinner(
    playersScore: PlayersScore,
    finalScore: number
  ): PlayerName | null;
}
