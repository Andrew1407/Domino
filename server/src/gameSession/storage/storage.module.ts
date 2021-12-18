import { DynamicModule, Module } from '@nestjs/common';
import { REDIS_CLIENT } from './storage.options';
import StorageService from './storage.service';

type RedisOptions = {
  useFactory: (...args: unknown[]) => unknown;
  inject: any[];
};

@Module({})
export default class StorageModule {
  public static register(options?: RedisOptions): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        Object.assign({ provide: REDIS_CLIENT }, options ? {
          inject: options.inject,
          useFactory: async (...args: unknown[]) => {
            const clientOptions = options.useFactory(...args);
            const client = StorageService.client(clientOptions);
            await client.connect();
            return client;
          }
        } : {
          useValue: StorageService.client(),
        }),
        StorageService,
      ],
      exports: [StorageService],
    };
  }

  public static forRoot(options?: RedisOptions): DynamicModule {
    return { ...StorageModule.register(options), global: true };
  } 
}
