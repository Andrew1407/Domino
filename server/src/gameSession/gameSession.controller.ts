import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import GameSessionGateway from './gameSession.gateway';
import GameSessionError from './wsTools/GameSessionError';

@Controller('domino-session')
export default class GameSessionController {
  constructor(private readonly gateway: GameSessionGateway) {}

  @Get()
  @HttpCode(HttpStatus.CREATED)
  public makeSessionUsingQuery(
    @Query('players', ParseIntPipe) players: number,
    @Query('score', ParseIntPipe) score: number
  ): Promise<string> {
    return this.makeSession(players, score);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public makeSessionUsingBody(
    @Body('players', ParseIntPipe) players,
    @Body('score', ParseIntPipe) score
  ): Promise<string> {
    return this.makeSession(players, score);
  }

  private async makeSession(players: number, score: number): Promise<string> {
    try {
      const sessionId: string = await this.gateway.newSession(players, score);
      return sessionId;
    } catch(e) {
      throw e instanceof GameSessionError ?
        new BadRequestException(e.message) :
        new InternalServerErrorException(e.message);
    }
  }
}
