import ScoreKeeperService from '../scoreKeeper.service';
import DominoTile from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import { PlayersDecks } from '../playMode/PlayMode';
import { PlayersScore } from '../playMode/ScoreKeeper';

type TestDataSumUp = {
  players: number,
  playersDecks: PlayersDecks,
  currentScore: PlayersScore,
  expectedScore?: PlayersScore,
};

type TestDataCheckWinner = {
  players: number,
  playersScore: PlayersScore,
  finalScore: number,
  expected?: PlayerName | null,
};

describe('classic score keeper class', (): void => {
  const scoreKeeper: ScoreKeeperService = new ScoreKeeperService();

  describe('roundSumUp', (): void => {
    const testDataForCalc: TestDataSumUp[] = [
      {
        players: 2,
        playersDecks: {
          Bobo: [DominoTile.of(0, 0), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
        },
        currentScore: { Bobo: 0, Mavun: 0, },
        expectedScore: { Bobo: 24, Mavun: 0, },
      },
      {
        players: 3,
        playersDecks: {
          Bobo: [DominoTile.of(0, 0), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 1)],
        },
        currentScore: { Bobo: 0, Mavun: 0, Ruzur: 0, },
        expectedScore: { Ruzur: 27, Mavun: 0, Bobo: 0, },
      },
      {
        players: 4,
        playersDecks: {
          Bobo: [DominoTile.of(4, 4), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 1)],
          Sasik: [DominoTile.of(1, 0)],
        },
        currentScore: { Bobo: 0, Mavun: 0, Ruzur: 0, Sasik: 0, },
        expectedScore: { Sasik: 37, Mavun: 0, Bobo: 0, Ruzur: 0, },
      },
    ];

    const testDataForSum: TestDataSumUp[] = [
      {
        players: 2,
        playersDecks: {
          Bobo: [DominoTile.of(0, 0), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
        },
        currentScore: { Bobo: 14, Mavun: 5, },
        expectedScore: { Bobo: 38, Mavun: 5, },
      },
      {
        players: 3,
        playersDecks: {
          Bobo: [DominoTile.of(0, 0), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 1)],
        },
        currentScore: { Bobo: 40, Mavun: 10, Ruzur: 17, },
        expectedScore: { Ruzur: 44, Mavun: 10, Bobo: 40, },
      },
      {
        players: 4,
        playersDecks: {
          Bobo: [DominoTile.of(4, 4), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 1)],
          Sasik: [DominoTile.of(1, 0)],
        },
        currentScore: { Bobo: 20, Mavun: 0, Ruzur: 5, Sasik: 89, },
        expectedScore: { Sasik: 126, Mavun: 0, Bobo: 20, Ruzur: 5, },
      },
    ];

    const testDataForDraw: TestDataSumUp[] = [
      {
        players: 2,
        playersDecks: {
          Bobo: [DominoTile.of(0, 0), DominoTile.of(6, 6)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(1, 3), DominoTile.of(2, 1)],
        },
        currentScore: { Bobo: 0, Mavun: 5, },
      },
      {
        players: 3,
        playersDecks: {
          Bobo: [DominoTile.of(0, 1), DominoTile.of(2, 1)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 3)],
        },
        currentScore: { Bobo: 40, Mavun: 10, Ruzur: 17, },
      },
      {
        players: 4,
        playersDecks: {
          Bobo: [DominoTile.of(1, 0), DominoTile.of(2, 0)],
          Mavun: [DominoTile.of(0, 5), DominoTile.of(4, 3), DominoTile.of(6, 6)],
          Ruzur: [DominoTile.of(1, 2)],
          Sasik: [DominoTile.of(0, 3)],
        },
        currentScore: { Bobo: 20, Mavun: 0, Ruzur: 5, Sasik: 89, },
      },
    ];

    it.each(testDataForCalc)(
      'should calculate the score for a winner ($players players)',
      ({ playersDecks, currentScore, expectedScore }: TestDataSumUp): void => {
        const result: PlayersScore = scoreKeeper.roundSumUp(playersDecks, currentScore);
        expect(result).toStrictEqual(expectedScore);
        expect(result).not.toBe(currentScore);
      }
    );

    it.each(testDataForSum)(
      'should sum the score for a winner ($players players)',
      ({ playersDecks, currentScore, expectedScore }: TestDataSumUp): void => {
        const result: PlayersScore = scoreKeeper.roundSumUp(playersDecks, currentScore);
        expect(result).toStrictEqual(expectedScore);
        expect(result).not.toBe(currentScore);
      }
    );

    it.each(testDataForDraw)(
      'should return the same score in case of draw ($players players)',
      ({ playersDecks, currentScore }: TestDataSumUp): void => {
        const result: PlayersScore = scoreKeeper.roundSumUp(playersDecks, currentScore);
        expect(result).toBe(currentScore);
      }
    );
  });

  describe('checkWinner', (): void => {
    const testDataIfWinner: TestDataCheckWinner[] = [
      {
        players: 2,
        playersScore: { Bobo: 12, Mavun: 0, },
        finalScore: 12,
        expected: 'Bobo',
      },
      {
        players: 3,
        playersScore: { Ruzur: 44, Mavun: 10, Bobo: 40, },
        finalScore: 40,
        expected: 'Ruzur',
      },
      {
        players: 4,
        playersScore: { Sasik: 126, Mavun: 0, Bobo: 20, Ruzur: 5, },
        finalScore: 80,
        expected: 'Sasik',
      },
    ];

    const testDataIfScoreLower: TestDataCheckWinner[] = [
      {
        players: 2,
        playersScore: { Bobo: 12, Mavun: 0, },
        finalScore: 120,
      },
      {
        players: 3,
        playersScore: { Ruzur: 44, Mavun: 10, Bobo: 40, },
        finalScore: 400,
      },
      {
        players: 4,
        playersScore: { Sasik: 16, Mavun: 0, Bobo: 20, Ruzur: 5, },
        finalScore: 120,
      },
    ];

    it.each(testDataIfWinner)(
      'should return winner name if score is reached ($players players)',
      ({ playersScore, finalScore, expected }: TestDataCheckWinner): void => {
        const result: PlayerName | null = scoreKeeper.checkWinner(playersScore, finalScore);
        expect(result).toEqual(expected);
      }
    );

    it.each(testDataIfScoreLower)(
      'should return null if the score is unreached for all players ($players players)',
      ({ playersScore, finalScore }: TestDataCheckWinner): void => {
        const result: PlayerName | null = scoreKeeper.checkWinner(playersScore, finalScore);
        expect(result).toBeNull();
      }
    );
  });
});
