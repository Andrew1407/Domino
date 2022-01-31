import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
import StorageService from '../storage/storage.service';
import StorageClient from '../storage/StorageClient';
import ScoreKeeper from '../playMode/ScoreKeeper';
import ScoreKeeperService from '../scoreKeeper.service';
import PlayMode, { PlayersDecks } from '../playMode/PlayMode';
import ClassicDominoService from '../classicDomino.service';
import GameSessionService from '../gameSession.service';
import GameSessionError from '../wsTools/GameSessionError';
import { PlayerRes, DecksInfoRes, MoveRes, RoundRes } from '../wsTools/responseTypes';
import { availablePlayers, PlayerName } from '../entities/Player';
import DominoTile, { EndValue, TilesDeck } from '../entities/DominoTile';

dotenv.config();

describe('game session service class', (): void => {
  const dbClient = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  });
  beforeAll(async (): Promise<void> => dbClient.connect());
  afterAll(async (): Promise<void> => {
    const entries: string[] = await dbClient.KEYS('domino:*');
    await Promise.all(
      entries.map((e: string): Promise<number> => dbClient.DEL(e))
    );
    await dbClient.quit();
  });
  const storageClient: StorageClient =
    new StorageService(dbClient as unknown as RedisClientType);
  const scoreKeeper: ScoreKeeper = new ScoreKeeperService();
  const dominoService: PlayMode = new ClassicDominoService();
  const gameSession: GameSessionService = new GameSessionService(
    storageClient, dominoService, scoreKeeper
  );

  describe('makeNewSession', (): void => {
    it.each([
      [1, 'lower'],
      [10, 'higher'],
    ])(
      'should throw an error when player count is %s than expected',
      async (playersAmount: number): Promise<void> => {
        await expect(gameSession.makeNewSession(playersAmount, 100)).rejects
          .toEqual(GameSessionError.badRequest());
      }
    );

    it.each([
      [0, 'lower'],
      [27985434, 'higher'],
    ])(
      'should throw an error when final score is %s than expected',
      async (finalScore: number): Promise<void> => {
        await expect(gameSession.makeNewSession(2, finalScore)).rejects
          .toEqual(GameSessionError.badRequest());
      }
    );

    it('should generate a session id', async (): Promise<void> => {
      const id: string = await gameSession.makeNewSession(3, 50);
      const expectedLength: number = 36;
      const expectedPartsAmount: number = 5;
      expect(typeof id).toEqual('string');
      expect(id).toHaveLength(expectedLength);
      expect(id.split('-')).toHaveLength(expectedPartsAmount);
    });
  });

  describe('joinSession', (): void => {
    it(
      'should return session data, player name and scores',
      async (): Promise<void> => {
        const players: number = 2;
        const score: number = 50;
        const id: string = await gameSession.makeNewSession(players, score);
        const joinRes: PlayerRes = await gameSession.joinSession(id);
        const expected: Partial<PlayerRes> = { players, score, round: 1 };
        expect(availablePlayers).toContain(joinRes.name);
        expect(Object.values(joinRes.scores)).toStrictEqual([0]);
        expect(joinRes).toMatchObject(expected);
      }
    );

    it(
      'should assign a unique name to each player',
      async (): Promise<void> => {
        const playersAmount: number = 4;
        const id: string = await gameSession.makeNewSession(4, 50);
        const isArrayUnique = (arr: PlayerName[]): boolean =>
          new Set(arr).size === arr.length;
        const names: PlayerName[] = [];
        for (let i: number = 0; i < playersAmount; ++i) {
          const res: PlayerRes = await gameSession.joinSession(id);
          names.push(res.name);
        }
        expect(isArrayUnique(names)).toBeTruthy();
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.joinSession('random-id')).rejects
          .toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if players limit is reached',
      async (): Promise<void> => {
        const playersAmount: number = 4;
        const id: string = await gameSession.makeNewSession(playersAmount, 50);
        for (let i: number = 0; i < playersAmount; ++i)
          await gameSession.joinSession(id);
        await expect(gameSession.joinSession(id)).rejects
          .toEqual(GameSessionError.playersLimit());
      }
    );
  });

  describe('shouldWaitForPlayers', (): void => {
    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.shouldWaitForPlayers('random-id')).rejects
          .toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should be truthy if not all players have joined yet',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await gameSession.joinSession(id);
        const result: boolean = await gameSession.shouldWaitForPlayers(id);
        expect(result).toBeTruthy();
      }
    );

    it(
      'should be false if the players limit is reached',
      async (): Promise<void> => {
        const playersAmount: number = 3;
        const id: string = await gameSession.makeNewSession(playersAmount, 50);
        for (let i: number = 0; i < playersAmount; ++i)
          await gameSession.joinSession(id);
        const result: boolean = await gameSession.shouldWaitForPlayers(id);
        expect(result).toBeFalsy();
      }
    );
  });

  describe('roundSetup', (): void => {
    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.roundSetup('random-id')).rejects
          .toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should return session data, stock size, player\'s deck and tiles count',
      async (): Promise<void> => {
        const players: number = 3;
        const deckSize: number = 5;
        const stock: number = 28 - players * deckSize;
        const score: number = 50;
        const id: string = await gameSession.makeNewSession(players, score);
        for (let i: number = 0; i < players; ++i)
          await gameSession.joinSession(id);
        const expected: Partial<DecksInfoRes> =
          { score, players, stock, round: 1 };
        const roundStartRes: DecksInfoRes[] = await gameSession.roundSetup(id);
        const expectedTilesCount: number[] = new Array(players ).fill(deckSize);
        const expectedScores: number[] = new Array(players).fill(0);
        expect(roundStartRes).toHaveLength(players);
        for (const result of roundStartRes) {
          const { name, deck, tilesCount, scores }: DecksInfoRes = result;
          expect(result).toMatchObject(expected);
          expect(availablePlayers).toContain(name);
          expect(deck).toHaveLength(deckSize);
          expect(Object.values(tilesCount)).toStrictEqual(expectedTilesCount);
          expect(Object.values(scores)).toStrictEqual(expectedScores);
        }
      }
    );
  });

  describe('firstMove', (): void => {
    it(
      'should return everything except player\'s deck to all users',
      async (): Promise<void> => {
        const tile: DominoTile = DominoTile.of(6, 6);
        const firstPlayer: PlayerName = 'Bobo';
        const playersTiles: PlayersDecks = {
          Mavun: [DominoTile.of(3, 5), DominoTile.of(2, 5), DominoTile.of(0, 0)],
          Bobo: [tile, DominoTile.of(1, 1), DominoTile.of(3, 4)],
          Sasik: [DominoTile.of(2, 4), DominoTile.of(1, 6), DominoTile.of(0, 3)]
        };
        const players: number = Object.keys(playersTiles).length;
        const score: number = 30;
        const id: string = await gameSession.makeNewSession(players, score);
        for (const [ player, tiles ] of Object.entries(playersTiles)) {
          await storageClient.setPlayerScore(id, player as PlayerName, 0);
          await storageClient.setPlayerDeck(id, player as PlayerName, tiles);
        }
        const expected: Partial<MoveRes> = {
          players,
          score,
          tile,
          round: 1,
          current_move: firstPlayer,
          commonDeck: [tile],
          scores: { Mavun: 0, Bobo: 0, Sasik: 0 },
        };
        const firstMoveRes: MoveRes[] = await gameSession.firstMove(id);
        expect(firstMoveRes).toHaveLength(players);
        for (const result of firstMoveRes) {
          expect(result).toMatchObject(expected);
          const tilesCountNames: PlayerName[] =
            Object.keys(result.tilesCount) as PlayerName[];
          expect(tilesCountNames).toHaveLength(players);
          if (result.name === firstPlayer) {
            const expectedLen: number = playersTiles[firstPlayer].length - 1;
            expect(result.deck).toHaveLength(expectedLen);
          } else {
            expect(result).not.toHaveProperty('deck');
          }
        }
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.firstMove('random-id')).rejects
          .toEqual(GameSessionError.notExists());
      }
    );
  });

  describe('shouldMove', (): void => {
    it(
      'should be truthy if current move must be player\'s',
      async (): Promise<void> => {
        const players: PlayerName[] = ['Mavun', 'Bobo', 'Sasik'];
        const id: string = await gameSession.makeNewSession(players.length, 30);
        for (const player of players)
          await storageClient.setPlayerScore(id, player, 0);
        await storageClient.setCurrentMove(id, players[0]);
        const result: boolean = await gameSession.shouldMove(id, players[0]);
        expect(result).toBeTruthy();
      }
    );

    it(
      'should be falsy if it\'s another player\'s turn to make a move',
      async (): Promise<void> => {
        const players: PlayerName[] = ['Mavun', 'Bobo', 'Sasik'];
        const id: string = await gameSession.makeNewSession(players.length, 30);
        for (const player of players)
          await storageClient.setPlayerScore(id, player, 0);
        await storageClient.setCurrentMove(id, players[0]);
        const result: boolean = await gameSession.shouldMove(id, players[1]);
        expect(result).toBeFalsy();
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.shouldMove('random-id', 'Mavun')).rejects
          .toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.shouldMove(id, 'Mavun')).rejects
          .toEqual(GameSessionError.forbidden());
      }
    );
  });

  describe('ableToMove', (): void => {
    it(
      'should be truthy if player makes a move with a valid tile',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 30);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        const tileA: DominoTile = DominoTile.of(2, 4);
        const tileB: DominoTile = DominoTile.of(4, 4);
        await storageClient.setPlayerDeck(id, name, [tileA, tileB]);
        await storageClient.setMoveAction(id, name, tileA, {
          side: 'left',
          reversed: false,
        });
        const result: boolean =
          await gameSession.ableToMove(id, name, tileB, 'right');
        expect(result).toBeTruthy();
      }
    );

    it(
      'should be falsy if player makes an invalid move',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 30);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        const tileA: DominoTile = DominoTile.of(2, 4);
        const tileB: DominoTile = DominoTile.of(4, 4);
        await storageClient.setPlayerDeck(id, name, [tileA, tileB]);
        await storageClient.setMoveAction(id, name, tileA, {
          side: 'left',
          reversed: false,
        });
        const result: boolean =
          await gameSession.ableToMove(id, name, tileB, 'left');
        expect(result).toBeFalsy();
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.ableToMove(
          'random-id',
          'Mavun',
          DominoTile.of(2, 3),
          'left'
        )).rejects.toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.ableToMove(
          id,
          'Mavun',
          DominoTile.of(2, 3),
          'left'
        )).rejects.toEqual(GameSessionError.forbidden());
      }
    );
  });

  describe('moveAction', (): void => {
    it(
      'should return everything except player\'s deck to all users',
      async (): Promise<void> => {
        const tileA: DominoTile = DominoTile.of(3, 5);
        const tileB: DominoTile = DominoTile.of(5, 2);
        const currentPlayer: PlayerName = 'Bobo';
        const playersTiles: PlayersDecks = {
          Mavun: [tileA, DominoTile.of(2, 5), DominoTile.of(0, 0)],
          Bobo: [tileB, DominoTile.of(1, 1), DominoTile.of(3, 4)],
          Sasik: [DominoTile.of(2, 4), DominoTile.of(1, 6), DominoTile.of(0, 3)]
        };
        const players: number = Object.keys(playersTiles).length;
        const score: number = 30;
        const id: string = await gameSession.makeNewSession(players, score);
        for (const [ player, tiles ] of Object.entries(playersTiles)) {
          await storageClient.setPlayerScore(id, player as PlayerName, 0);
          await storageClient.setPlayerDeck(id, player as PlayerName, tiles);
        }
        await storageClient.setMoveAction(id, 'Mavun', tileA, {
          side: 'left',
          reversed: false,
        });
        await storageClient.setCurrentMove(id, currentPlayer);
        const expected: Partial<MoveRes> = {
          players,
          score,
          tile: tileB,
          round: 1,
          current_move: currentPlayer,
          commonDeck: [tileA, tileB],
          scores: { Mavun: 0, Bobo: 0, Sasik: 0 },
        };
        const firstMoveRes: MoveRes[] =
          await gameSession.moveAction(id, currentPlayer, tileB, 'right');
        expect(firstMoveRes).toHaveLength(players);
        for (const result of firstMoveRes) {
          expect(result).toMatchObject(expected);
          expect(Object.keys(result.tilesCount)).toHaveLength(players);
          if (result.name === currentPlayer) {
            const expectedLen: number = playersTiles[currentPlayer].length - 1;
            expect(result.deck).toHaveLength(expectedLen);
          } else {
            expect(result).not.toHaveProperty('deck');
          }
        }
      }
    );

    it.each([
      { tileB: DominoTile.of(4, 1), reverse: false },
      { tileB: DominoTile.of(1, 4), reverse: true }
    ])(
      'should reverse tile if needed (reversed: $reverse)',
      async ({ tileB, reverse }: { tileB: DominoTile, reverse: boolean }): Promise<void> => {
        const tileA: DominoTile = DominoTile.of(3, 4);
        const currentPlayer: PlayerName = 'Bobo';
        const playersTiles: PlayersDecks = {
          Mavun: [tileA, DominoTile.of(2, 5), DominoTile.of(0, 0)],
          Bobo: [tileB, DominoTile.of(1, 1), DominoTile.of(3, 4)],
        };
        const players: number = Object.keys(playersTiles).length;
        const id: string = await gameSession.makeNewSession(players, 50);
        for (const [ player, tiles ] of Object.entries(playersTiles)) {
          await storageClient.setPlayerScore(id, player as PlayerName, 0);
          await storageClient.setPlayerDeck(id, player as PlayerName, tiles);
        }
        await storageClient.setMoveAction(id, 'Mavun', tileA, {
          side: 'left',
          reversed: false,
        });
        await storageClient.setCurrentMove(id, currentPlayer);
        const firstMoveRes: MoveRes[] =
          await gameSession.moveAction(id, currentPlayer, tileB, 'right');
        for (const { tile } of firstMoveRes) {
          const expected: DominoTile = reverse ? tileB.copyReversed() : tileB;
          expect(tile).toStrictEqual(expected);
        }
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.moveAction(
          'random-id',
          'Mavun',
          DominoTile.of(2, 3),
          'left'
        )).rejects.toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.moveAction(
          id,
          'Mavun',
          DominoTile.of(2, 3),
          'left'
        )).rejects.toEqual(GameSessionError.forbidden());
      }
    );

    it(
      'should throw an error if move is not possible',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        const tileA: DominoTile = DominoTile.of(2, 4);
        const tileB: DominoTile = DominoTile.of(1, 0);
        await storageClient.setPlayerDeck(id, name, [tileA, tileB]);
        await storageClient.setMoveAction(id, name, tileA, {
          side: 'left',
          reversed: false,
        });
        await expect(gameSession.moveAction(id, name, tileB, 'left'))
          .rejects.toEqual(GameSessionError.badRequest());
      }
    );
  });

  describe('getFromStock', (): void => {
    it(
      'should send the tile only to current player',
      async (): Promise<void> => {
        const players: number = 2;
        const score: number = 50;
        const id: string = await gameSession.makeNewSession(players, score);
        const stock: TilesDeck = [
          DominoTile.of(3, 2),
          DominoTile.of(6, 6),
          DominoTile.of(2, 1),
        ]
        const { name }: PlayerRes = await gameSession.joinSession(id);
        await gameSession.joinSession(id);
        await storageClient.setStock(id, stock);
        const expected: Partial<MoveRes> = {
          players, score, stock: stock.length - 1, round: 1,
        };
        const stockRes: MoveRes[] = await gameSession.getFromStock(id, name);
        for (const result of stockRes) {
          expect(result).toMatchObject(expected);
          if (result.name === name) expect(stock).toContainEqual(result.tile);
          else expect(result).not.toHaveProperty('tile');
        }
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.getFromStock('random-id', 'Mavun',))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.getFromStock(id, 'Mavun'))
          .rejects.toEqual(GameSessionError.forbidden());
      }
    );
  });

  describe('ableToPlay', (): void => {
    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.ableToPlay('random-id', 'Mavun',))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.ableToPlay(id, 'Mavun'))
          .rejects.toEqual(GameSessionError.forbidden());
      }
    );
  });

  describe('setNextPlayer', (): void => {
    it('should change the current move field', async (): Promise<void> => {
      const players: PlayerName[] = ['Mavun', 'Bobo', 'Sasik'];
      const id: string = await gameSession.makeNewSession(players.length, 20);
      for (const player of players)
        await storageClient.setPlayerScore(id, player, 0);
      await storageClient.setCurrentMove(id, players[0]);
      let nextPlayer: PlayerName = await gameSession.setNextPlayer(id);
      expect(nextPlayer).toEqual(players[1]);
      nextPlayer = await gameSession.setNextPlayer(id);
      expect(nextPlayer).toEqual(players[2]);
      nextPlayer = await gameSession.setNextPlayer(id);
      expect(nextPlayer).toEqual(players[0]);
    });

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.setNextPlayer('random-id'))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );
  });

  describe('outOfTiles', (): void => {
    it(
      'should be truthy if player\'s deck is empty',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 20);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        const result: boolean = await gameSession.outOfTiles(id, name);
        expect(result).toBeTruthy();
      }
    );

    it(
      'should be falsy if there are tiles in player\'s deck',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 20);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        await storageClient.setPlayerDeck(id, name, [DominoTile.of(0, 1)]);
        const result: boolean = await gameSession.outOfTiles(id, name);
        expect(result).toBeFalsy();
      }
    );
  });

  describe('endRound', (): void => {
    it(
      'should return round results',
      async (): Promise<void> => {
        const left: EndValue = 2;
        const right: EndValue = 3;
        const winScore: number = left + right;
        const score: number = 50;
        const winner: PlayerName = 'Bobo';
        const playersTiles: PlayersDecks = {
          Bobo: [],
          Mavun: [DominoTile.of(left, right)], 
        }
        const players: number = Object.keys(playersTiles).length;
        const id: string = await gameSession.makeNewSession(players, score);
        for (const player of Object.keys(playersTiles))
          await storageClient.setPlayerScore(id, player as PlayerName, 0);
        await storageClient.setPlayerDeck(id, 'Mavun', playersTiles['Mavun']);
        const expected: RoundRes = {
          players,
          score,
          winner,
          round: 1,
          scores: { Bobo: winScore, Mavun: 0 },
          endGame: false
        };
        const result: RoundRes = await gameSession.endRound(id);
        expect(result).toMatchObject(expected);
      }
    );

    it(
      'should avoid "winner" field if there is a draw',
      async (): Promise<void> => {
        const playersTiles: PlayersDecks = {
          Bobo: [DominoTile.of(4, 3)],
          Mavun: [DominoTile.of(6, 1)], 
        }
        const players: number = Object.keys(playersTiles).length;
        const id: string = await gameSession.makeNewSession(players, 40);
        for (const [player, deck] of Object.entries(playersTiles)) {
          await storageClient.setPlayerScore(id, player as PlayerName, 0);
          await storageClient.setPlayerDeck(id, player as PlayerName, deck);
        }
        const result: RoundRes = await gameSession.endRound(id);
        expect(result).not.toHaveProperty('winner');
      }
    );

    it(
      'should set "endGame" to true if final score is reached',
      async (): Promise<void> => {
        const playersTiles: PlayersDecks = {
          Bobo: [DominoTile.of(4, 3)],
          Mavun: [DominoTile.of(0, 1)], 
        }
        const players: number = Object.keys(playersTiles).length;
        const id: string = await gameSession.makeNewSession(players, 40);
        for (const [player, deck] of Object.entries(playersTiles)) {
          await storageClient.setPlayerScore(id, player as PlayerName, 39);
          await storageClient.setPlayerDeck(id, player as PlayerName, deck);
        }
        const result: RoundRes = await gameSession.endRound(id);
        expect(result.endGame).toBeTruthy();
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.endRound('random-id'))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );
  });

  describe('removeSession', (): void => {
    it('should remove all session data', async (): Promise<void> => {
      const id: string = await gameSession.makeNewSession(3, 40);
      await gameSession.removeSession(id);
      await expect(gameSession.removeSession(id))
        .rejects.toEqual(GameSessionError.notExists());
    });

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.removeSession('random-id'))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );
  });

  describe('removePlayer', (): void => {
    it(
      'should return sesion data and removed player\'s name',
      async (): Promise<void> => {
        const players: number = 3;
        const score: number = 40;
        const id: string = await gameSession.makeNewSession(players, score);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        const expected: PlayerRes = {
          players, score, name, round: 1, scores: {},
        }
        const result: PlayerRes = await gameSession.removePlayer(id, name);
        expect(result).toMatchObject(expected);
      }
    );

    it(
      'should remove player from the session\'s list of players',
      async (): Promise<void> => {
        const players: number = 3;
        const score: number = 40;
        const id: string = await gameSession.makeNewSession(players, score);
        await gameSession.joinSession(id);
        const { name }: PlayerRes = await gameSession.joinSession(id);
        await gameSession.removePlayer(id, name);
        const playerNames: PlayerName[] =
          await storageClient.getSessionPlayers(id);
        expect(playerNames).not.toContain(name);
      }
    );

    it(
      'should throw an error if session does not exist',
      async (): Promise<void> => {
        await expect(gameSession.removePlayer('random-id', 'Mavun'))
          .rejects.toEqual(GameSessionError.notExists());
      }
    );

    it(
      'should throw an error if player does not exist',
      async (): Promise<void> => {
        const id: string = await gameSession.makeNewSession(2, 50);
        await expect(gameSession.removePlayer(id, 'Mavun'))
          .rejects.toEqual(GameSessionError.forbidden());
      }
    );
  });
});
