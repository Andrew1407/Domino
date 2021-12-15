import { Module } from '@nestjs/common';
import GameSessionController from './gameSession.controller';
import GameSessionGateway from './gameSession.gateway';

@Module({
  providers: [GameSessionGateway],
  controllers: [GameSessionController],
})
export default class GameSessionModule {}
