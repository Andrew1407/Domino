import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from 'src/envConfig';
import GameSessionModule from 'src/gameSession/gameSession.module';
import AppController from './app.controller';
import AppService from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    GameSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export default class AppModule {}
