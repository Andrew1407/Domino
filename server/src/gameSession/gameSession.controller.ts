import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import GameSessionGateway from './gameSession.gateway';

@Controller('domino-session')
export default class GameSessionController {
  constructor(private readonly gateway: GameSessionGateway) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  public getInitialPage(): string {
    return 'mazur-divno';
  }

  @Get(':msg')
  @HttpCode(HttpStatus.OK)
  public sendMessage(@Param('msg') message: string) {
    this.gateway.sendMessage(message);
  }
}
