import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import AppService from './app.service';

@Controller()
export default class AppController {
  constructor(private readonly service: AppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  public getMenuPage(): string {
    return this.service.getTitle();
  }
}
