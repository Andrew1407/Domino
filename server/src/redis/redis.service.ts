import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.options';

@Injectable()
export default class RedisService implements OnApplicationShutdown {
  public static client(options = {}) {
    return createClient(options);
  }

  constructor(@Inject(REDIS_CLIENT) private readonly dbClient: RedisClientType) {}

  public onApplicationShutdown(): void {
    this.dbClient?.quit();
  }

}
