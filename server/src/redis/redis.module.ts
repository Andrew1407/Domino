import { DynamicModule, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.options';
import RedisService from './redis.service';

type RedisOptions = {
  useFactory: (...args: unknown[]) => unknown;
  inject: any[];
};

@Module({})
export default class RedisModule {
  public static register(options?: RedisOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        Object.assign({ provide: REDIS_CLIENT }, options ? {
          inject: options.inject,
          useFactory: async (...args: unknown[]) => {
            const clientOptions = options.useFactory(...args);
            const client = RedisService.client(clientOptions);
            await client.connect();
            return client;
          }
        } : {
          useValue: RedisService.client(),
        }),
        RedisService,
      ],
      exports: [RedisService],
    };
  }

  public static forRoot(options?: RedisOptions): DynamicModule {
    return { ...RedisModule.register(options), global: true };
  } 
}
