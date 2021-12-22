import { setTimeout } from 'timers/promises';
import { BeforeApplicationShutdown } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import GameSessionService from './gameSession.service';
import GameSessionError from './wsTools/GameSessionError';
import { availablePlayers, PlayerName } from './entities/Player';
import GameSessionRes, { DecksInfoRes, PlayerRes, MoveRes, DisconnectedRes, MovePermissionRes, RoundRes } from './wsTools/responseTypes';
import ErrorStatus from './wsTools/ErrorStatus';
import DominoTile from './entities/DominoTile';
import { MoveOption } from './playMode/PlayMode';
import MoveState from './playMode/MoveState';

interface SessionPlayer {
  name: PlayerName,
  socket: WebSocket
}

type GameSessions = { [session: string]: SessionPlayer[] };
type GameSessionResP<T> = Promise<GameSessionRes<T>>;
type TileData = { left: number, right: number };

dotenv.config();

const WS_PORT: number = parseInt(process.env.WS_PORT, 10) || 8081;
const WS_ROUTE: string = process.env.WS_ROUTE || '/domino-session';

@WebSocketGateway(WS_PORT, { path: WS_ROUTE })
export default class GameSessionGateway implements BeforeApplicationShutdown, OnGatewayDisconnect {
  @WebSocketServer() private readonly wss: Server;
  private sessions: GameSessions = {};

  constructor(public readonly sessionHandler: GameSessionService) {}

  public async newSession(players: number, finalScore: number): Promise<string> {
    const id: string = await this.sessionHandler.makeNewSession(players, finalScore);
    this.sessions[id] = [];
    return id;
  }

  public async beforeApplicationShutdown(): Promise<void> {
    await Promise.all(Object.keys(this.sessions)
      .map((s: string): Promise<void> => this.sessionHandler.removeSession(s))
    );
  }

  public async handleDisconnect(client: WebSocket): Promise<void> {
    for (const sid in this.sessions) {
      const players: SessionPlayer[] = this.sessions[sid];
      const disconnected: SessionPlayer = players
        .find((p: SessionPlayer): boolean => p.socket === client);
      if (!disconnected) continue;
      const awaitStart: boolean = await this.sessionHandler.shouldWaitForPlayers(sid);
      if (awaitStart) {
        const notifyData: PlayerRes = await this.sessionHandler.removePlayer(sid, disconnected.name);
        const removeIdx: number = this.sessions[sid].indexOf(disconnected);
        this.sessions[sid].splice(removeIdx, 1);
        for (const { socket } of this.sessions[sid])
          socket.send(this.responseWrapperStr(notifyData, 'leaveSession'));
      } else {
        const disconnectedData: DisconnectedRes = { name: disconnected.name };
        for (const { socket } of this.sessions[sid]) {
          socket.send(this.responseWrapperStr(disconnectedData, 'interruptedSession'));
          socket.close();
        }
        await this.sessionHandler.removeSession(sid);
        delete this.sessions[sid];
      }
      return;      
    }
  }
  
  @SubscribeMessage('test-data')
  @GameSessionError.catchHandler()
  public onTestData(@ConnectedSocket() client: WebSocket, @MessageBody() data: string): WsResponse<string> {
    // this.sss[data] ??= [];
    // this.sss[data].push(client);
    // return data.length;
    return { event: 'sasa', data };
  }

  @SubscribeMessage('joinSession')
  @GameSessionError.catchHandler()
  public async onSessionJoin(
    @ConnectedSocket() client: WebSocket,
    @MessageBody('session') session: string
  ): GameSessionResP<PlayerRes> {
    if (typeof session !== 'string') throw GameSessionError.badRequest();
    if (!this.sessions[session]) throw GameSessionError.notExists();
    const clientReserved: boolean = this.sessions[session]
      .some((c: SessionPlayer): boolean => c.socket === client);
    if (clientReserved) throw GameSessionError.forbidden();
    const joinedInfo: PlayerRes = await this.sessionHandler.joinSession(session);
    for (const { socket } of this.sessions[session])
      socket.send(this.responseWrapperStr(joinedInfo, 'sessionNewcomer'));
    this.sessions[session].push({ name: joinedInfo.name, socket: client });
    const shouldWait: boolean = await this.sessionHandler.shouldWaitForPlayers(session);
    if (!shouldWait) this.startNewRound(session);
    return this.responseWrapper(joinedInfo, 'joinSession');
  }

  @SubscribeMessage('moveCheck')
  @GameSessionError.catchHandler()
  public async onMoveCheck(
    @MessageBody('session') session: string,
    @MessageBody('player') player: PlayerName,
    @MessageBody('tile') tileData: TileData,
    @MessageBody('side') moveSide: MoveOption
  ): GameSessionResP<MovePermissionRes> {
    await this.validateParams(session, player);
    if (moveSide !== 'left' && moveSide !== 'right') throw GameSessionError.badRequest();
    const tile: DominoTile = this.parseTileData(tileData);
    const permission: boolean = await this.sessionHandler
      .ableToMove(session, player, tile, moveSide);
    return this.responseWrapper({ permission }, 'moveCheck');
  }

  @SubscribeMessage('moveAction')
  @GameSessionError.catchHandler()
  public async onMoveAction(
    @MessageBody('session') session: string,
    @MessageBody('player') player: PlayerName,
    @MessageBody('tile') tileData: TileData,
    @MessageBody('side') moveSide: MoveOption
  ): Promise<void> {
    await this.validateParams(session, player);
    if (moveSide !== 'left' && moveSide !== 'right') throw GameSessionError.badRequest();
    const tile: DominoTile = this.parseTileData(tileData);
    const moveRes: MoveRes[] =
      await this.sessionHandler.moveAction(session, player, tile, moveSide);
    this.notifyPlayers(session, moveRes, 'moveAction');
    const emptyDeck: boolean = await this.sessionHandler.outOfTiles(session, player);
    if (emptyDeck) this.endRound(session);

  }

  // TODO: get player's name by socket client (without sending);
  // from stock doesn't add new tile somehow
  @SubscribeMessage('fromStock')
  @GameSessionError.catchHandler()
  public async onTakeFromStock(
    @MessageBody('session') session: string,
    @MessageBody('player') player: PlayerName
  ): Promise<void> {
    await this.validateParams(session, player);
    let stockRes: MoveRes[];
    try {
      stockRes = await this.sessionHandler.getFromStock(session, player);
    } catch(e) {
      const emptyStockMsg: string = 'there are no tiles in the stock';
      if (e.message !== emptyStockMsg) throw e;
      throw GameSessionError.forbidden();
    }
    this.notifyPlayers(session, stockRes, 'fromStock');
    const moveState: MoveState = await this.sessionHandler.ableToPlay(session, player);
    if (moveState === MoveState.SKIPPABLE) this.nextPlayerMove(session);
    else if (moveState === MoveState.DEAD_END) this.endRound(session);
  }

  public async validateParams(
    session: string,
    player: PlayerName
  ): Promise<void> {
    if (typeof session !== 'string') throw GameSessionError.badRequest();
    if (!availablePlayers.includes(player)) throw GameSessionError.badRequest();
    const shouldMove: boolean = await this.sessionHandler.shouldMove(session, player);
    if (!shouldMove) throw GameSessionError.unavailableMove();
  }

  private async endRound(session: string): Promise<void> {
    const delay: number = 1000;
    await setTimeout(delay);
    const roundRes: RoundRes = await this.sessionHandler.endRound(session);
    for (const { socket } of this.sessions[session]) {
      socket.send(this.responseWrapperStr(roundRes, 'endRound'));
      if (roundRes.endGame) socket.close();
    }
    if (roundRes.endGame) {
      await this.sessionHandler.removeSession(session);
      delete this.sessions[session];
    }
  }

  private parseTileData(tile: TileData): DominoTile {
    if (!tile) throw GameSessionError.badRequest();
    const { left, right }: TileData = tile;
    if (typeof left !== 'string' || typeof right !== 'string')
      throw GameSessionError.badRequest();
    const invalidLeftValue: boolean = left < 0 || left > 6;
    const invalidRightValue: boolean = right < 0 || right > 6;
    if (invalidLeftValue || invalidRightValue)
      throw GameSessionError.badRequest();
    return DominoTile.of(left, right);
  }

  private async startNewRound(session: string): Promise<void> {
    const delay: number = 3000;
    await setTimeout(delay);
    const decksInfo: DecksInfoRes[] = await this.sessionHandler.roundSetup(session);
    this.notifyPlayers(session, decksInfo, 'roundStart');
    await setTimeout(delay);
    const firstMoveInfo: MoveRes[] = await this.sessionHandler.firstMove(session);
    this.notifyPlayers(session, firstMoveInfo, 'firstMove');
    this.nextPlayerMove(session);
  }

  private async nextPlayerMove(session: string): Promise<void> {
    const delay = 1000;
    await setTimeout(delay);
    const nextPlayer: PlayerName = await this.sessionHandler.setNextPlayer(session);
    for (const { socket } of this.sessions[session])
      socket.send(this.responseWrapperStr(nextPlayer, 'nextMove'));
    const moveState: MoveState = await this.sessionHandler.ableToPlay(session, nextPlayer);
    if (moveState === MoveState.SKIPPABLE) this.nextPlayerMove(session);
    else if (moveState === MoveState.DEAD_END) this.endRound(session);
  }

  private notifyPlayers<T extends { name: PlayerName }>(
    session: string,
    dataArr: T[],
    event: string
  ): void {
    for (const { name, socket } of this.sessions[session]) {
      const data: T = dataArr.find((d: T): boolean => d.name === name);
      socket.send(this.responseWrapperStr(data, event));
    }
  }

  private responseWrapper<T>(data: T, event: string): GameSessionRes<T> {
    return { event, data, errorStatus: ErrorStatus.NONE };
  }

  private responseWrapperStr<T>(data: T, event: string): string {
    return JSON.stringify(this.responseWrapper(data, event));
  }
}
