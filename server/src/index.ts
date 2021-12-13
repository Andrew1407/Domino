import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  NestFastifyApplication as FastifyApp,
  FastifyAdapter
} from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import AppModule from './app/app.module';

(async () => {
  const fastifyAdapter: FastifyAdapter = new FastifyAdapter();
  const app: FastifyApp = await NestFactory.create(AppModule, fastifyAdapter, { cors: true });
  
  app.useWebSocketAdapter(new WsAdapter(app));

  const configService: ConfigService = app.get(ConfigService);
  const PORT: number = configService.get('port');
  const HOST: string = configService.get('host');

  app.enableShutdownHooks();

  await app.listen(PORT, HOST);
})();
