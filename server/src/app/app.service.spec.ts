import { Test, TestingModule } from '@nestjs/testing';
import AppController from './app.controller';
import AppService from './app.service';

describe('app service', () => {
  it('should return correct title', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    expect(module.get(AppService)).toBeInstanceOf(AppService);
    expect(module.get(AppController)).toBeInstanceOf(AppController);
  })
});
