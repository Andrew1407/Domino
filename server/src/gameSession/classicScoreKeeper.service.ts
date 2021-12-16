import { Injectable } from '@nestjs/common';
import DominoTile, { TilesDeck } from './entities/DominoTile';
import { PlayerName } from './entities/Player';
import { PlayersDecks } from './playMode/PlayMode';
import ScoreKeeper, { PlayersScore } from './playMode/ScoreKeeper';

@Injectable()
export default class ClassicScoreKeeper implements ScoreKeeper {
  public roundSumUp(
    playersDecks: PlayersDecks,
    currentScore: PlayersScore
  ): PlayersScore {
    const newScore: PlayersScore = { ...currentScore };
    const roundScore: PlayersScore = this.countRoundScore(playersDecks);
    type PlayerStats = [string, number];
    const winnerReducer = (cur: PlayerStats, next: PlayerStats): PlayerStats => (
      next[1] < cur[1] ? next : cur
    );
    const scoreEntries: PlayerStats[] = Object.entries(roundScore);
    const [ winner, minScore ]: PlayerStats = scoreEntries.reduce(winnerReducer);
    const draw: boolean = 1 < Object.values(roundScore)
      .filter((n: number): boolean => n === minScore)
      .length;

    if (draw) return currentScore;
    const winnerScoreReducer = (res: number, [name, score]: PlayerStats): number => (
      name !== winner ? res + score : res 
    );
    newScore[winner] += scoreEntries.reduce(winnerScoreReducer, 0);
    
    return newScore;
  }

  public checkWinner(
    playersScore: PlayersScore,
    finalScore: number
  ): PlayerName | null {
    for (const player in playersScore)
      if (playersScore[player] >= finalScore)
        return player as PlayerName;

    return null;
  }

  private countRoundScore(playersDecks: PlayersDecks): PlayersScore {
    const countScore = (sum: number, t: DominoTile): number => sum + t.tileSum();
    const scoreReducer = (
      acc: PlayersScore,
      [player, deck]: [PlayerName, TilesDeck]
    ): PlayersScore => ({
      ...acc,
      [player]: deck.reduce(countScore, 0),
    });
    return Object.entries(playersDecks).reduce(scoreReducer, {});
  }
}
