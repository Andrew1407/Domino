import { Test, TestingModule } from '@nestjs/testing';
import { WebSocket } from 'ws';
import { setTimeout } from 'timers/promises';
import DominoTile from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import GameSessionGateway from '../gameSession.gateway';
import GameSessionService from '../gameSession.service';
import { MoveOption } from '../playMode/PlayMode';
import GameSessionError from '../wsTools/GameSessionError';
import GameSessionRes, { MovePermissionRes, PlayerRes } from '../wsTools/responseTypes';


const gameSessionServiceStub: Record<string, jest.Mock> = {
  makeNewSession: jest.fn((): string => 'test-session-id'),
  removeSession: jest.fn(),
  removePlayer: jest.fn(),
  shouldWaitForPlayers: jest.fn(async (): Promise<boolean> => true),
  shouldMove: jest.fn((): boolean => true),
  joinSession: jest.fn((): object => ({ name: 'Bobo' })),
  ableToMove: jest.fn((): boolean => false),
  ableToPlay: jest.fn((): boolean => false),
  moveAction: jest.fn((): unknown[] => []),
  outOfTiles: jest.fn((): boolean => false),
  setNextPlayer: jest.fn(),
  getFromStock: jest.fn(),
};

describe('game session gateway', (): void => {
  let gateway: GameSessionGateway;
  beforeAll(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameSessionGateway, GameSessionService],
    })
      .overrideProvider(GameSessionService)
      .useValue(gameSessionServiceStub)
      .compile();
    gateway = module.get(GameSessionGateway);
  });

  afterEach((): void => {
    for (const sid of Object.keys(gateway['sessions']))
      delete gateway['sessions'][sid];
    jest.clearAllMocks();
  });

  describe('makeNewSession', (): void => {    
    it('should return created session id', async (): Promise<void> => {
      const players: number = 2;
      const score: number = 56;
      const result: string = await gateway.newSession(players, score);
      expect(result).toEqual('test-session-id');
      expect(gameSessionServiceStub.makeNewSession).toBeCalledTimes(1);
      expect(gameSessionServiceStub.makeNewSession).toBeCalledWith(players, score);
    });

    it('should create an empty session players array', async (): Promise<void> => {
      const id: string = await gateway.newSession(3, 10);
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      expect(sessions).toHaveProperty(id);
      expect(Object.keys(sessions)).toHaveLength(1);
      expect(sessions[id]).toHaveLength(0);
    });
  });

  describe('beforeApplicationShutdown', (): void => {
    it(
      'should call "removeSession" method 2 times with session id params',
      async (): Promise<void> => {
        const sessions: { [key: string]: unknown[] } = gateway['sessions'];
        sessions['session-1'] = [];
        sessions['session-2'] = [];
        gateway.beforeApplicationShutdown();
        expect(gameSessionServiceStub.removeSession).toBeCalledTimes(2);
        expect(gameSessionServiceStub.removeSession).nthCalledWith(1, 'session-1');
        expect(gameSessionServiceStub.removeSession).nthCalledWith(2, 'session-2');
      }
    );
  });

  describe('handleDisconnect', (): void => {
    it('should remove session if shouldWaitForPlayers is false', async (): Promise<void> => {
      gameSessionServiceStub.shouldWaitForPlayers
        .mockImplementationOnce(async (): Promise<boolean> => false);
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      const name: PlayerName = 'Bobo';
      sessions[id] = [{ name, socket: null }];
      await gateway.handleDisconnect(null);
      expect(gameSessionServiceStub.removePlayer).toBeCalledTimes(0);
      expect(gameSessionServiceStub.removeSession).toBeCalledTimes(1);
      expect(gameSessionServiceStub.removeSession).toBeCalledWith(id);
      expect(sessions).not.toHaveProperty(id);
    });

    it('should remove player if shouldWaitForPlayers is true', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      const name: PlayerName = 'Bobo';
      sessions[id] = [{ name, socket: null }];
      await gateway.handleDisconnect(null);
      expect(gameSessionServiceStub.removeSession).toBeCalledTimes(1);
      expect(gameSessionServiceStub.removePlayer).toBeCalledTimes(1);
      expect(gameSessionServiceStub.removePlayer).toBeCalledWith(id, name);
      expect(sessions).not.toHaveProperty(id);
    });
  });

  describe('onSessionJoin', (): void => {
    it('should return an error when type of session is not a string', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: GameSessionRes<PlayerRes> = await gateway.onSessionJoin(null, null);
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the session doesn\'t exist', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.notExists().info();
      const result: GameSessionRes<PlayerRes> = await gateway.onSessionJoin(null, 'test-session-id');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the client has already joined', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      const result: GameSessionRes<PlayerRes> = await gateway.onSessionJoin(null, id);
      expect(result).toStrictEqual(expectedErr);
    });

    it('should add client to session array', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [];
      await gateway.onSessionJoin(null, id);
      expect(gameSessionServiceStub.joinSession).toBeCalledTimes(1);
      expect(sessions[id]).toStrictEqual([{ name: 'Bobo', socket: null }]);
    });
  });

  describe('onMoveCheck', (): void => {
    it('should return an error when type of session is not a string', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, null, { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the session doesn\'t exist', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, 'test-session-id', { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the player doesn\'t exist', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [];
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, id, { left: '2', right: '4' }, 'left');
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when client cannot move', async (): Promise<void> => {
      gameSessionServiceStub.shouldMove
        .mockImplementationOnce((): boolean => false);
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.unavailableMove().info();
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, id, { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when move option is invalid', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, id, { left: '2', right: '4' }, null);
      expect(result).toStrictEqual(expectedErr);
    });

    it.each([
      [null, 'no tile'],
      [{ left: '56ds', right: '4' }, 'data cannot be parsed'],
      [{ left: '8', right: '2' }, 'left end out of range'],
      [{ left: '0', right: '-2' }, 'right end out of range'],
    ])(
      'should return an error when tile is invalid (%s)',
      async (tile: { left: string, right: string }): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: GameSessionRes<MovePermissionRes> =
        await gateway.onMoveCheck(null, id, tile, 'right');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should call ableToMove', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      const tile: { left: string, right: string } = { left: '3', right: '5' };
      const side: MoveOption = 'right';
      const name: PlayerName = 'Bobo';
      sessions[id] = [{ name, socket: null }];
      await gateway.onMoveCheck(null, id, tile, side);
      expect(gameSessionServiceStub.ableToMove).toBeCalledTimes(1);
      expect(gameSessionServiceStub.ableToMove)
        .toBeCalledWith(id, name, DominoTile.of(3, 5), side);
    });
  });

  describe('onMoveAction', (): void => {
    it('should return an error when type of session is not a string', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: void =
        await gateway.onMoveAction(null, null, { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the session doesn\'t exist', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      const result: void =
        await gateway.onMoveAction(null, 'test-session-id', { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the player doesn\'t exist', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [];
      const result: unknown =
        await gateway.onMoveAction(null, id, { left: '2', right: '4' }, 'left');
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when client cannot move', async (): Promise<void> => {
      gameSessionServiceStub.shouldMove
        .mockImplementationOnce((): boolean => false);
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.unavailableMove().info();
      const result: unknown =
        await gateway.onMoveAction(null, id, { left: '2', right: '4' }, 'left');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when move option is invalid', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: unknown =
        await gateway.onMoveAction(null, id, { left: '2', right: '4' }, null);
      expect(result).toStrictEqual(expectedErr);
    });

    it.each([
      [null, 'no tile'],
      [{ left: '3', right: 'hjk' }, 'data cannot be parsed'],
      [{ left: '0078', right: '2' }, 'left end out of range'],
      [{ left: '3', right: '-123' }, 'right end out of range'],
    ])(
      'should return an error when tile is invalid (%s)',
      async (tile: { left: string, right: string }): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: unknown = await gateway.onMoveAction(null, id, tile, 'right');
      expect(result).toStrictEqual(expectedErr);
    });

    it.each([
      ['moveAction', 'test-session-id', 'Bobo', DominoTile.of(0, 1), 'right'],
      ['outOfTiles', 'test-session-id', 'Bobo'],
    ])(
      'should call "%s" method',
      async (method: string, ...params: unknown[]): Promise<void> => {        
        const sessions: { [key: string]: unknown[] } = gateway['sessions'];
        const id: string = 'test-session-id';
        const sockeStub: object = { send: () => {} };
        sessions[id] = [{ name: 'Bobo', socket: sockeStub }];
        await gateway.onMoveAction(sockeStub as WebSocket, id, { left: '0', right: '1' }, 'right');
        expect(gameSessionServiceStub[method]).toBeCalledTimes(1);
        expect(gameSessionServiceStub[method]).toBeCalledWith(...params);
        // simulation of response sending
        await setTimeout(2100);
      }
    );
  });

  describe('onTakeFromStock', (): void => {
    it('should return an error when type of session is not a string', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.badRequest().info();
      const result: unknown = await gateway.onTakeFromStock(null, null);
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the session doesn\'t exist', async (): Promise<void> => {
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      const result: unknown = await gateway.onTakeFromStock(null, 'test-session-id');
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when the player doesn\'t exist', async (): Promise<void> => {
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [];
      const result: unknown = await gateway.onTakeFromStock(null, id);
      const expectedErr: GameSessionRes<string> = GameSessionError.forbidden().info();
      expect(result).toStrictEqual(expectedErr);
    });

    it('should return an error when client cannot move', async (): Promise<void> => {
      gameSessionServiceStub.shouldMove
        .mockImplementationOnce((): boolean => false);
      const sessions: { [key: string]: unknown[] } = gateway['sessions'];
      const id: string = 'test-session-id';
      sessions[id] = [{ name: 'Bobo', socket: null }];
      const expectedErr: GameSessionRes<string> = GameSessionError.unavailableMove().info();
      const result: unknown = await gateway.onTakeFromStock(null, id);
      expect(result).toStrictEqual(expectedErr);
    });

    it(
      'should return an error (from "getFromStock") when the stock is empty',
      async (): Promise<void> => {
        gameSessionServiceStub.getFromStock.mockImplementationOnce((): never => {
          throw new Error('there are no tiles in the stock');
        });
        const expectedErr: GameSessionRes<string> = GameSessionError.emptyStock().info();
        const sessions: { [key: string]: unknown[] } = gateway['sessions'];
        const id: string = 'test-session-id';
        sessions[id] = [{ name: 'Bobo', socket: null }];  
        const result: unknown = await gateway.onTakeFromStock(null, id);
        expect(result).toStrictEqual(expectedErr);
        expect(gameSessionServiceStub.getFromStock).toBeCalledTimes(1);
        expect(gameSessionServiceStub.getFromStock).toBeCalledWith(id, 'Bobo');
      }
    );
  });
});
