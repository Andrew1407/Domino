import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';
import AppService from './app.service';

@Controller()
export default class AppController {
  constructor(private readonly service: AppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('content-type', 'application/json')
  public getCommandsList(): Promise<string> {
    return this.service.getCommands();
  }
}
