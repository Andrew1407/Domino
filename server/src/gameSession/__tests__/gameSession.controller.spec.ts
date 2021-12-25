import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import GameSessionController from '../gameSession.controller';
import GameSessionGateway from '../gameSession.gateway';
import GameSessionError from '../wsTools/GameSessionError';

const gatewayStub: { [method: string]: jest.Mock } = {
  newSession: jest.fn((): string => 'session-test-id'),
};

describe('game session controller', (): void => {
  let controller: GameSessionController;
  beforeAll(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameSessionController],
      providers: [GameSessionGateway],
    })
      .overrideProvider(GameSessionGateway)
      .useValue(gatewayStub)
      .compile();
    controller = module.get(GameSessionController);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });


  describe.each([
    'makeSessionUsingQuery',
    'makeSessionUsingBody',
  ])('%s', (method: keyof GameSessionController): void => {
    it('sould resolve session id', async (): Promise<void> => {
      await expect(controller[method](3, 56)).resolves
        .toEqual('session-test-id');
    });

    it('sould call "newSession" method with taken params', async (): Promise<void> => {
      const players: number = 3;
      const score: number = 56;
      await controller[method](players, score);
      expect(gatewayStub.newSession).toBeCalledTimes(1);
      expect(gatewayStub.newSession).toBeCalledWith(players, score);
    });

    it('sould reject BadRequestException', async (): Promise<void> => {
      gatewayStub.newSession.mockImplementationOnce((): never => {
        throw GameSessionError.badRequest();
      });
      await expect(controller[method](2, 26)).rejects
        .toStrictEqual(new BadRequestException('Invalid session data has been sent'));
    });

    it('sould reject InternalServerErrorException', async (): Promise<void> => {
      gatewayStub.newSession.mockImplementationOnce((): never => {
        throw new Error('test error message');
      });
      await expect(controller[method](2, 26)).rejects
        .toStrictEqual(new InternalServerErrorException('test error message'));
    });
  });
});
