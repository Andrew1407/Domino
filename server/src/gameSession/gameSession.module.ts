import { Module } from '@nestjs/common';
import GameSessionGateway from './gameSession.gateway';

@Module({
  providers: [GameSessionGateway],
})
export default class GameSessionModule {}
