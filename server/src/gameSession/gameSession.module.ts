import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StorageService from 'src/gameSession/storage/storage.module';
import GameSessionController from './gameSession.controller';
import GameSessionGateway from './gameSession.gateway';

@Module({
  imports: [
    StorageService.register({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('redis'),
    }),
  ],
  providers: [GameSessionGateway],
  controllers: [GameSessionController],
})
export default class GameSessionModule {}
