import { RedisClientType } from 'redis';
import { MoveOption, PlayersDecks } from 'src/gameSession/playMode/PlayMode';
import { PlayersScore } from 'src/gameSession/playMode/ScoreKeeper';
import DominoTile, { TilesDeck } from '../../entities/DominoTile';
import { PlayerName } from '../../entities/Player';
import StorageService from '../storage.service';
import StorageClient, { SessionData } from '../StorageClient';

type FakeStorage = { [key: string]: unknown };

class RedisClientMock {
  public readonly fakeStorage: FakeStorage = {};

  public async HSET(field: string, key: string, value: unknown): Promise<void> {
    this.fakeStorage[`${field}:${key}`] = String(value);
  }

  public async HGET(field: string, key: string): Promise<string | null> {
    const found: string = this.fakeStorage[`${field}:${key}`] as string;
    return found ?? null;
  }

  public async HKEYS(field: string): Promise<string[]> {
    const values: string[] = await this.KEYS(field + ':*');
    return values.map((v: string): string => v.split(':').pop());
  }

  public async KEYS(template: string): Promise<string[]> {
    const field: string = template.slice(0, -1);
    return Object.keys(this.fakeStorage)
      .filter((k: string): boolean => k.startsWith(field))
  }

  public async DEL(field: string | string[]): Promise<void> {
    if (Array.isArray(field)) {
      await Promise.all(
        field.map((f: string): Promise<void> => this.DEL(f))
      );
      return;
    }
    const fieldEntries: string[] = field.split(':');
    const namespace: string = fieldEntries[1];
    const removebleFields: string[] = ['sessions', 'players_score'];
    if (!removebleFields.includes(namespace)) {
      delete this.fakeStorage[field];
      return;
    }
    const template: string = fieldEntries.slice(0, -1).join(':');
    const values: string[] = await this.KEYS(template + ':*');
    values.forEach((f: string): void => {
      delete this.fakeStorage[f];
    });
  }

  public async HDEL(field: string, key: string): Promise<void> {
    delete this.fakeStorage[`${field}:${key}`];
  }

  public async HGETALL(field: string): Promise<object> {
    const values: string[] = await this.KEYS(field + ':*');
    return values.reduce((acc: object, f: string): object => ({
      ...acc, [f.split(':').pop()]: this.fakeStorage[f]
    }), {});
  }

  public async EXISTS(field: string): Promise<boolean> {
    const foundKeys: string[] = await this.KEYS(field);
    return !!foundKeys.length;
  }

  public async SADD(field: string, value: string | string[]): Promise<void> {
    if (!Array.isArray(value)) {
      this.fakeStorage[field] ??= [];
      (this.fakeStorage[field] as string[]).push(value);
      return;
    }
    await Promise.all(
      value.map((v: string): Promise<void> => this.SADD(field, v))
    );
  }

  public async LLEN(field: string): Promise<number> {
    return (this.fakeStorage[field] as string[])?.length ?? 0;
  }

  public async SCARD(field: string): Promise<number> {
    return this.LLEN(field);
  }

  public async SRANDMEMBER(field: string): Promise<string> {
    const length: number = await this.SCARD(field);
    if (!length) return null;
    const randIdx: number = Math.floor(Math.random() * length);
    return (this.fakeStorage[field] as string[])[randIdx];
  }

  public async SREM(field: string, value: string): Promise<number> {
    const initialLength: number = (this.fakeStorage[field] as string[]).length;
    this.fakeStorage[field] = (this.fakeStorage[field] as string[])
      .filter((val: string): boolean => value !== val);
    const newLength: number = (this.fakeStorage[field] as string[]).length;
    return initialLength - newLength;
  }

  public async RPUSH(field: string, value: string | string[]): Promise<void> {
    this.fakeStorage[field] ??= [];
    if (Array.isArray(value))
      this.fakeStorage[field] = (this.fakeStorage[field] as string[]).concat(value);
    else
      (this.fakeStorage[field] as string[]).push(value);
  }

  public async LPUSH(field: string, value: string | string[]): Promise<void> {
    this.fakeStorage[field] ??= [];
    if (Array.isArray(value))
      this.fakeStorage[field] = value.concat(this.fakeStorage[field] as string[]);
    else
      (this.fakeStorage[field] as string[]).unshift(value);
  }

  public async LINDEX(field: string, index: number): Promise<string> {
    const container: string[] = this.fakeStorage[field] as string[];
    if (!container) return null;
    const position: number = index < 0 ? container.length + index : index;
    return container[position] ?? null;
  }

  public async SMEMBERS(field: string): Promise<string[]> {
    return this.fakeStorage[field] as string[];
  }

  public async LRANGE(field: string, start: number, stop: number): Promise<string[]> {
    const container: string[] = this.fakeStorage[field] as string[];
    if (!container) return [];
    const to: number = stop < 0 ? container.length + stop : stop;
    return container.slice(start, to + 1);
  }
}

describe('storage service (StorageClient interface)', (): void => {
  const redisMock: RedisClientMock = new RedisClientMock();
  const storageClient: StorageClient = new StorageService(redisMock as unknown as RedisClientType);
  const sessionId: string = 'test_session';
  const storagePath: string = 'domino:sessions:' + sessionId;

  afterEach((): void => {
    Object.keys(redisMock.fakeStorage).forEach((key: string): void => {
      delete redisMock.fakeStorage[key];
    });
  });

  describe('createSession', (): void => {
    it('should store session data', async (): Promise<void> => {
      const score: number = 26;
      const players: number = 3;
      await storageClient.createSession(sessionId, score, players);
      expect(await redisMock.HGET(storagePath, 'score'))
        .toEqual(score.toString());
      expect(await redisMock.HGET(storagePath, 'players'))
        .toEqual(players.toString());
      expect(await redisMock.HGET(storagePath, 'round'))
        .toEqual('1');
    });
  });

  describe('sessionExists', (): void => {
    it('should be true if session exists', async (): Promise<void> => {
      await storageClient.createSession(sessionId, 100, 4);
      const result = await storageClient.sessionExists(sessionId);
      expect(result).toBeTruthy();
    });

    it(
      'should be false if session doesn\'t exist',
      async (): Promise<void> => {
        const result = await storageClient.sessionExists(sessionId);
        expect(result).toBeFalsy();
      }
    );
  });

  describe('nextRound', (): void => {
    it('should increment round count', async (): Promise<void> => {
      await storageClient.createSession(sessionId, 100, 4);
      await storageClient.nextRound(sessionId);
      const result: string = await redisMock.HGET(storagePath, 'round');
      const expected: string = '2';
      expect(result).toEqual(expected);
    });

    it(
      'should clear stock, common deck and players deck',
      async (): Promise<void> => {
        await storageClient.createSession(sessionId, 100, 2);
        const stockPath: string = 'domino:stock:' + sessionId;
        const deckPath: string = 'domino:deck:' + sessionId;
        const playerDeckPath: string = `domino:player_deck:${sessionId}:`;
        const playerScorePath: string = `domino:players_score:${sessionId}:`;
        redisMock.fakeStorage[`${playerScorePath}Bobo`] = 'test user 1';
        redisMock.fakeStorage[`${playerScorePath}Ruzur`] = 'test user 2';
        redisMock.fakeStorage[stockPath] = 'test data 1';
        redisMock.fakeStorage[deckPath] = 'test data 2';
        redisMock.fakeStorage[`${playerDeckPath}Bobo`] = 'test user 1';
        redisMock.fakeStorage[`${playerDeckPath}Ruzur`] = 'test user 2';
        await storageClient.nextRound(sessionId);
        expect(redisMock.fakeStorage[stockPath]).toBeUndefined();
        expect(redisMock.fakeStorage[deckPath]).toBeUndefined();
        expect(redisMock.fakeStorage[`${playerDeckPath}Bobo`])
          .toBeUndefined();
        expect(redisMock.fakeStorage[`${playerDeckPath}Ruzur`])
          .toBeUndefined();
      }
    );

    it(
      'should not clear score, players number and players score',
      async (): Promise<void> => {
        await storageClient.createSession(sessionId, 100, 2);
        const scorePath: string = `domino:sessions:${sessionId}:score`;
        const playersPath: string = `domino:sessions:${sessionId}:players`;
        const playerScorePath: string = `domino:players_score:${sessionId}:`;
        redisMock.fakeStorage[`${playerScorePath}Bobo`] = 'test user 1';
        redisMock.fakeStorage[`${playerScorePath}Ruzur`] = 'test user 2';
        await storageClient.nextRound(sessionId);
        expect(redisMock.fakeStorage[scorePath]).toBeDefined();
        expect(redisMock.fakeStorage[playersPath]).toBeDefined();
        expect(redisMock.fakeStorage[`${playerScorePath}Bobo`])
          .toBeDefined();
        expect(redisMock.fakeStorage[`${playerScorePath}Ruzur`])
          .toBeDefined();
      }
    );
  });

  describe('getSessionData', () => {
    it(
      'should return score, players, round and current move',
      async (): Promise<void> => {
        const score: number = 26;
        const players: number = 3;
        const current_move: PlayerName = 'Sasik';
        await storageClient.createSession(sessionId, score, players);
        await redisMock.HSET(storagePath, 'current_move', current_move);
        const result: SessionData = await storageClient.getSessionData(sessionId);
        const expected: SessionData = { score, players, current_move, round: 1 };
        expect(result).toStrictEqual(expected);
      }
    );
  });

  describe('setCurrentMove', () => {
    it('should store current player name', async (): Promise<void> => {
      const name: PlayerName = 'Bobo';
      await storageClient.setCurrentMove(sessionId, name);
      const result: string = await redisMock.HGET(storagePath, 'current_move');
      expect(result).toEqual(name);
    });
  });

  describe('getCurrentMove', () => {
    it('should return current player name', async (): Promise<void> => {
      const name: PlayerName = 'Bobo';
      const currentMovePath = `domino:sessions:${sessionId}:current_move`;
      redisMock.fakeStorage[currentMovePath] = name;
      const result: string = await storageClient.getCurrentMove(sessionId);
      expect(result).toEqual(name);
    });

    it(
      'should throw an error when user doesn\'t exist',
      async (): Promise<void> => {
        await expect(storageClient.getCurrentMove(sessionId)).rejects
          .toEqual(new Error('no such user exists'));
      }
    );
  });
  
  describe('setStock', (): void => {
    it('should store a stock', async (): Promise<void> => {
      const deck: TilesDeck = [DominoTile.of(1, 1), DominoTile.of(5, 4)];
      await storageClient.setStock(sessionId, deck);
      const result: string[] = redisMock.fakeStorage['domino:stock:' + sessionId] as string[];
      const expected: string[] = deck.map(
        (t: DominoTile): string => JSON.stringify(t)
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe('getFromStock', (): void => {
    it('should give one random tile', async (): Promise<void> => {
      const field: string = 'domino:stock:' + sessionId;
      redisMock.fakeStorage[field] = [
        JSON.stringify(DominoTile.of(1, 1)),
        JSON.stringify(DominoTile.of(5, 4)),
        JSON.stringify(DominoTile.of(6, 1)),
      ];
      const expectedLength: number = (redisMock.fakeStorage[field] as string[]).length - 1;
      const got: DominoTile = await storageClient.getFromStock(sessionId);
      const modifiedDeck: string[] = redisMock.fakeStorage[field] as string[];
      const toBeRemoved: string = JSON.stringify(got);
      expect(modifiedDeck).toHaveLength(expectedLength);
      expect(modifiedDeck).not.toContain(toBeRemoved);
    });

    it(
      'should throw an error when the stock is empty',
      async (): Promise<void> => {
        await expect(storageClient.getFromStock(sessionId)).rejects
          .toEqual(new Error('there are no tiles in the stock'));
      }
    );
  });

  describe('getStockSize', (): void => {
    it('should return stock size', async () => {
      const field: string = 'domino:stock:' + sessionId;
      redisMock.fakeStorage[field] = [
        JSON.stringify(DominoTile.of(1, 1)),
        JSON.stringify(DominoTile.of(5, 4)),
        JSON.stringify(DominoTile.of(6, 1)),
      ];
      const expected: number = (redisMock.fakeStorage[field] as string[]).length;
      const result: number = await storageClient.getStockSize(sessionId);
      expect(result).toEqual(expected);
    });
  });

  describe('setMoveAction', (): void => {
    it(
      'should remove the specified tile from player\'s deck',
      async (): Promise<void> => {
        const player: PlayerName = 'Ruzur';
        const toBeRemoved: DominoTile = DominoTile.of(5, 4);
        const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
        redisMock.fakeStorage[playerDeckPath] = [
          JSON.stringify(DominoTile.of(1, 1)),
          JSON.stringify(toBeRemoved),
          JSON.stringify(DominoTile.of(6, 1)),
        ];
        const expectedLength: number = 
          (redisMock.fakeStorage[playerDeckPath] as string[]).length - 1;
        await storageClient.setMoveAction(sessionId, player, toBeRemoved, 'left', false);
        const modifiedDeck: string[] = redisMock.fakeStorage[playerDeckPath] as string[];
        expect(modifiedDeck).toHaveLength(expectedLength);
        expect(modifiedDeck).not.toContain(JSON.stringify(toBeRemoved));
      }
    );

    it.each(['left', 'right'])(
      'should add the specified tile to the %s end of the deck',
      async (side: MoveOption): Promise<void> => {
        const player: PlayerName = 'Ruzur';
        const toBeAdded: DominoTile = DominoTile.of(5, 4);
        const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
        const commonDeckPath: string = 'domino:deck:' + sessionId;
        redisMock.fakeStorage[playerDeckPath] = [
          JSON.stringify(DominoTile.of(1, 1)),
          JSON.stringify(toBeAdded),
          JSON.stringify(DominoTile.of(6, 1)),
        ];
        redisMock.fakeStorage[commonDeckPath] = [
          JSON.stringify(DominoTile.of(0, 0)),
        ];
        const expectedLength: number =
          (redisMock.fakeStorage[commonDeckPath] as string[]).length + 1;
        const expectedIndex: number = side === 'left' ? 0 : expectedLength - 1;
        await storageClient.setMoveAction(sessionId, player, toBeAdded, side, false);
        const modifiedDeck: string[] = redisMock.fakeStorage[commonDeckPath] as string[];
        expect(modifiedDeck).toHaveLength(expectedLength);
        expect(modifiedDeck.indexOf(JSON.stringify(toBeAdded)))
          .toEqual(expectedIndex);
      }
    );

    it.each(['left', 'right'])(
      'should add the reversed tile to the %s end of the deck',
      async (side: MoveOption): Promise<void> => {
        const player: PlayerName = 'Ruzur';
        const toBeAdded: DominoTile = DominoTile.of(5, 4);
        const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
        const commonDeckPath: string = 'domino:deck:' + sessionId;
        redisMock.fakeStorage[playerDeckPath] = [
          JSON.stringify(DominoTile.of(1, 1)),
          JSON.stringify(toBeAdded),
          JSON.stringify(DominoTile.of(6, 1)),
        ];
        redisMock.fakeStorage[commonDeckPath] = [
          JSON.stringify(DominoTile.of(0, 0)),
        ];
        const expectedLength: number =
          (redisMock.fakeStorage[commonDeckPath] as string[]).length + 1;
        const expectedIndex: number = side === 'left' ? 0 : expectedLength - 1;
        await storageClient.setMoveAction(sessionId, player, toBeAdded, side, true);
        const modifiedDeck: string[] = redisMock.fakeStorage[commonDeckPath] as string[];
        expect(modifiedDeck).toHaveLength(expectedLength);
        expect(modifiedDeck.indexOf(JSON.stringify(toBeAdded.copyReversed())))
          .toEqual(expectedIndex);
      }
    );

    it.each([
      [[], 'is empty'],
      [[JSON.stringify(DominoTile.of(1, 1))], 'doesn\'t contain the tile'],
      [
        [JSON.stringify(DominoTile.of(0, 1)), JSON.stringify(DominoTile.of(0, 1))],
        'contains duplicate tiles'
      ]
    ])(
      'should throw an error when the deck %s',
      async (deck: string[]): Promise<void> => {
        const player: PlayerName = 'Bobo';
        const tile: DominoTile = DominoTile.of(0, 1);
        const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
        redisMock.fakeStorage[playerDeckPath] = deck;
        await expect(storageClient.setMoveAction(sessionId, player, tile, 'left', false))
          .rejects.toEqual(new Error('invalid deck entries'));
      }
    );
  });

  describe('getDeckEnds', (): void => {
    it('should return left and right ends', async (): Promise<void> => {
      const commonDeckPath: string = 'domino:deck:' + sessionId;
      const expectedRight: DominoTile = DominoTile.of(3, 5);
      const expectedLeft: DominoTile = DominoTile.of(6, 6);
      redisMock.fakeStorage[commonDeckPath] = [
        JSON.stringify(expectedLeft),
        JSON.stringify(DominoTile.of(0, 1)),
        JSON.stringify(expectedRight)
      ];
      const result: TilesDeck = await storageClient.getDeckEnds(sessionId);
      const [ gotLeft, gotRight ]: TilesDeck = result;
      const expectedLength: number = 2;
      expect(result).toHaveLength(expectedLength);
      expect(gotLeft).toStrictEqual(expectedLeft);
      expect(gotRight).toStrictEqual(expectedRight);
    });

    it(
      'should return the same ends if deck size is 1',
      async (): Promise<void> => {
        const commonDeckPath: string = 'domino:deck:' + sessionId;
        const expected: DominoTile = DominoTile.of(3, 5);
        redisMock.fakeStorage[commonDeckPath] = [JSON.stringify(expected)];
        const result: TilesDeck = await storageClient.getDeckEnds(sessionId);
        const [ gotLeft, gotRight ]: TilesDeck = result;
        const expectedLength: number = 2;
        expect(result).toHaveLength(expectedLength);
        expect(gotLeft).toStrictEqual(expected);
        expect(gotRight).toStrictEqual(expected);
      }
    );

    it(
      'should throw an error if the deck is empty',
      async (): Promise<void> => {
        await expect(storageClient.getDeckEnds(sessionId)).rejects
          .toEqual(new Error('the deck is empty'));
      }
    );
  });

  describe('getPlayersScore', (): void => {
    it('should return players score', async (): Promise<void> => {
      const scores: PlayersScore = {
        Bobo: 0,
        Ruzur: 45,
        Sasik: 10,
      }
      const playerScorePath: string = `domino:players_score:${sessionId}:`;
      for (const player in scores)
        redisMock.fakeStorage[playerScorePath + player] = scores[player].toString();
      const result: PlayersScore = await storageClient.getPlayersScore(sessionId);
      expect(result).toStrictEqual(scores);
    })
  });

  describe('setPlayerScore', (): void => {
    it('should store player score', async (): Promise<void> => {
      const player: PlayerName = 'Sasik';
      const expectedScore: number = 100;
      const scorePath: string = `domino:players_score:${sessionId}:${player}`;
      await storageClient.setPlayerScore(sessionId, player, expectedScore);
      const result: string = redisMock.fakeStorage[scorePath] as string;
      expect(result).toEqual(expectedScore.toString());
    });
  });

  describe('getPlayersDecks', () => {
    it('should return decks of the players', async (): Promise<void> => {
      const tiles: PlayersDecks = {
        Bobo: [DominoTile.of(6, 6)],
        Ruzur: [DominoTile.of(4, 1)],
        Sasik: [DominoTile.of(1, 0)],
      }
      const scores: PlayersScore = {
        Bobo: 0,
        Ruzur: 45,
        Sasik: 10,
      }
      const playerScorePath: string = `domino:players_score:${sessionId}:`;
      const playerDecksPath: string = `domino:player_deck:${sessionId}:`;
      for (const player in tiles) {
        const stringified: string[] = tiles[player]
          .map((t: DominoTile): string => JSON.stringify(t));;
        redisMock.fakeStorage[playerDecksPath + player] = stringified;
        redisMock.fakeStorage[playerScorePath + player] = scores[player].toString();
      }
      const result: PlayersDecks = await storageClient.getPlayersDecks(sessionId);
      expect(result).toStrictEqual(tiles);
    });
  });

  describe('getSessionPlayers', () => {
    it('should return names of all the players', async (): Promise<void> => {
      const expectedPlayers: PlayerName[] = ['Bobo', 'Ruzur', 'Sasik'];
      const scores: PlayersScore = {
        Bobo: 0,
        Ruzur: 45,
        Sasik: 10,
      }
      const playerScorePath: string = `domino:players_score:${sessionId}:`;
      for (const player in scores)
        redisMock.fakeStorage[playerScorePath + player] = scores[player].toString();
      const result: PlayerName[] = await storageClient.getSessionPlayers(sessionId);
      expect(result).toStrictEqual(expectedPlayers);
    });
  });

  describe('removeSession', (): void => {
    it('should clear all the fields of the session', async (): Promise<void> => {
      await storageClient.createSession(sessionId, 100, 2);
        const stockPath: string = 'domino:stock:' + sessionId;
        const deckPath: string = 'domino:deck:' + sessionId;
        const scorePath: string = `domino:sessions:${sessionId}:score`;
        const playersPath: string = `domino:sessions:${sessionId}:players`;
        const playerDeckPath: string = `domino:player_deck:${sessionId}:`;
        const playerScorePath: string = `domino:players_score:${sessionId}:`;
        redisMock.fakeStorage[`${playerScorePath}Bobo`] = 'test user 1';
        redisMock.fakeStorage[`${playerDeckPath}Bobo`] = 'test user 2';
        redisMock.fakeStorage[stockPath] = 'test data 1';
        redisMock.fakeStorage[deckPath] = 'test data 2';
        redisMock.fakeStorage[scorePath] = 'test data 3';
        redisMock.fakeStorage[playersPath] = 'test data 4';
        await storageClient.removeSession(sessionId);
        expect(redisMock.fakeStorage[stockPath]).toBeUndefined();
        expect(redisMock.fakeStorage[deckPath]).toBeUndefined();
        expect(redisMock.fakeStorage[scorePath]).toBeUndefined();
        expect(redisMock.fakeStorage[playersPath]).toBeUndefined();
        expect(redisMock.fakeStorage[`${playerScorePath}Bobo`])
          .toBeUndefined();
        expect(redisMock.fakeStorage[`${playerDeckPath}Bobo`])
          .toBeUndefined();
    })
  });

  describe('setPlayerDeck', (): void => {
    it('should store player\'s deck', async () => {
      const testData: TilesDeck = [DominoTile.of(4, 1), DominoTile.of(2, 5)];
      const player: PlayerName = 'Mavun';
      await storageClient.setPlayerDeck(sessionId, player, testData);
      const expected: string[] = testData
        .map((t: DominoTile): string => JSON.stringify(t));
      const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
      const result: string[] = redisMock.fakeStorage[playerDeckPath] as string[];
      expect(result).toStrictEqual(expected);
    });
  });

  describe('playerDeckEmpty', (): void => {
    it('should be falsy if the deck has tile(s)', async (): Promise<void> => {
      const testData: string[] = [
        JSON.stringify(DominoTile.of(4, 1)),
        JSON.stringify(DominoTile.of(2, 5)),
      ];
      const player: PlayerName = 'Mavun';
      const playerDeckPath: string = `domino:player_deck:${sessionId}:${player}`;
      redisMock.fakeStorage[playerDeckPath] = testData;
      const result: boolean = await storageClient.playerDeckEmpty(sessionId, player);
      expect(result).toBeFalsy();
    });

    it('should be truthy if the deck is empty', async (): Promise<void> => {
      const player: PlayerName = 'Mavun';
      const result: boolean = await storageClient.playerDeckEmpty(sessionId, player);
      expect(result).toBeTruthy();
    });
  });

  describe('removePlayerScore', (): void => {
    it('should remove player\'s score record', async (): Promise<void> => {
      const player: PlayerName = 'Sasik';
      const playerScorePath: string = `domino:players_score:${sessionId}:${player}`;
      redisMock.fakeStorage[playerScorePath] = 'test data';
      await storageClient.removePlayerScore(sessionId, player);
      expect(redisMock.fakeStorage[playerScorePath]).toBeUndefined();
    });
  });

  describe('getCommonDeck', (): void => {
    it('should return a common deck', async () => {
      const deckPath: string = 'domino:deck:' + sessionId;
      const testData: TilesDeck = [
        DominoTile.of(5, 5),
        DominoTile.of(1, 2),
      ];
      redisMock.fakeStorage[deckPath] = testData
        .map((t: DominoTile): string => JSON.stringify(t));
      const result: TilesDeck = await storageClient.getCommonDeck(sessionId);
      expect(result).toStrictEqual(testData);
    });
  });
});
