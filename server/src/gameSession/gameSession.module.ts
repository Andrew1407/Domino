import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StorageService from 'src/gameSession/storage/storage.module';
import ClassicDominoService from './classicDomino.service';
import ScoreKeeperService from './scoreKeeper.service';
import GameSessionController from './gameSession.controller';
import GameSessionGateway from './gameSession.gateway';
import GameSessionService from './gameSession.service';
import { CLASSIC_DOMINO_SERVICE, SCORE_KEEPER_SERVICE } from './gameSession.options';

@Module({
  imports: [
    StorageService.register({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('redis'),
    }),
  ],
  controllers: [GameSessionController],
  providers: [
    { provide: CLASSIC_DOMINO_SERVICE, useClass: ClassicDominoService, },
    { provide: SCORE_KEEPER_SERVICE, useClass: ScoreKeeperService, },
    GameSessionService,
    GameSessionGateway,
  ],
})
export default class GameSessionModule {}
