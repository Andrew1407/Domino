import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisModule from 'src/redis/redis.module';
import GameSessionController from './gameSession.controller';
import GameSessionGateway from './gameSession.gateway';

@Module({
  imports: [
    RedisModule.register({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('redis'),
    }),
  ],
  providers: [GameSessionGateway],
  controllers: [GameSessionController],
})
export default class GameSessionModule {}
