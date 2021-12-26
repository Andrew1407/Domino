import { setTimeout } from 'timers/promises';
import { BeforeApplicationShutdown } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import GameSessionService from './gameSession.service';
import GameSessionError from './wsTools/GameSessionError';
import { PlayerName } from './entities/Player';
import GameSessionRes, { DecksInfoRes, PlayerRes, MoveRes, NameContainerRes, MovePermissionRes, RoundRes, NextMoveRes } from './wsTools/responseTypes';
import ErrorStatus from './wsTools/ErrorStatus';
import DominoTile, { EndValue } from './entities/DominoTile';
import { MoveOption } from './playMode/PlayMode';
import MoveState from './playMode/MoveState';

interface SessionPlayer {
  name: PlayerName,
  socket: WebSocket
}

type GameSessions = { [session: string]: SessionPlayer[] };
type GameSessionResP<T> = Promise<GameSessionRes<T>>;
type TileData = { left: string, right: string };

dotenv.config();

const WS_PORT: number = parseInt(process.env.WS_PORT, 10) || 8081;
const WS_ROUTE: string = process.env.WS_ROUTE || '/domino-session';

@WebSocketGateway(WS_PORT, { path: WS_ROUTE })
export default class GameSessionGateway implements BeforeApplicationShutdown, OnGatewayDisconnect {
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
        if (!this.sessions[sid].length) {
          await this.sessionHandler.removeSession(sid);
          delete this.sessions[sid];
        } else {
          for (const { socket } of this.sessions[sid])
            socket.send(this.responseWrapperStr(notifyData, 'leaveSession'));
        }
      } else {
        const disconnectedData: NameContainerRes = { name: disconnected.name };
        for (const { socket, name } of this.sessions[sid]) {
          if (disconnected.name === name) continue;
          socket.send(this.responseWrapperStr(disconnectedData, 'interruptedSession'));
          socket.close();
        }
        await this.sessionHandler.removeSession(sid);
        delete this.sessions[sid];
      }
      return;      
    }
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
    @ConnectedSocket() client: WebSocket,
    @MessageBody('session') session: string,
    @MessageBody('tile') tileData: TileData,
    @MessageBody('side') moveSide: MoveOption
  ): GameSessionResP<MovePermissionRes> {
    const player: PlayerName = await this.validatePlayerParams(client, session);
    if (moveSide !== 'left' && moveSide !== 'right') throw GameSessionError.badRequest();
    const tile: DominoTile = this.parseTileData(tileData);
    const permission: boolean = await this.sessionHandler
      .ableToMove(session, player, tile, moveSide);
    return this.responseWrapper({ permission }, 'moveCheck');
  }

  @SubscribeMessage('moveAction')
  @GameSessionError.catchHandler()
  public async onMoveAction(
    @ConnectedSocket() client: WebSocket,
    @MessageBody('session') session: string,
    @MessageBody('tile') tileData: TileData,
    @MessageBody('side') moveSide: MoveOption
  ): Promise<void> {
    const player: PlayerName = await this.validatePlayerParams(client, session);
    if (moveSide !== 'left' && moveSide !== 'right') throw GameSessionError.badRequest();
    const tile: DominoTile = this.parseTileData(tileData);
    const moveRes: MoveRes[] =
      await this.sessionHandler.moveAction(session, player, tile, moveSide);
    this.notifyPlayers(session, moveRes, 'moveAction');
    const emptyDeck: boolean = await this.sessionHandler.outOfTiles(session, player);
    if (emptyDeck) this.endRound(session);
    else this.nextPlayerMove(session);
  }

  @SubscribeMessage('fromStock')
  @GameSessionError.catchHandler()
  public async onTakeFromStock(
    @ConnectedSocket() client: WebSocket,
    @MessageBody('session') session: string
  ): Promise<void> {
    const player: PlayerName = await this.validatePlayerParams(client, session);
    try {
      const stockRes: MoveRes[] = await this.sessionHandler.getFromStock(session, player);
      this.notifyPlayers(session, stockRes, 'fromStock');
      this.handleMoveState(session, player);
    } catch(e) {
      const emptyStockMsg: string = 'there are no tiles in the stock';
      if (e.message !== emptyStockMsg) throw e;
      throw GameSessionError.emptyStock();
    }
  }

  private async validatePlayerParams(
    socket: WebSocket,
    session: string
  ): Promise<PlayerName> {
    if (typeof session !== 'string') throw GameSessionError.badRequest();
    const player: SessionPlayer = this.sessions[session]?.find(
      (p: SessionPlayer): boolean => p.socket === socket
    );
    if (!player) throw GameSessionError.forbidden();
    const shouldMove: boolean =
      await this.sessionHandler.shouldMove(session, player.name);
    if (!shouldMove) throw GameSessionError.unavailableMove();
    return player.name;
  }

  private async endRound(
    session: string,
    deadEnd: boolean = false
  ): Promise<void> {
    const delay: number = 1000;
    await setTimeout(delay);
    const roundRes: RoundRes = await this.sessionHandler.endRound(session);
    roundRes.deadEnd = deadEnd;
    for (const { socket } of this.sessions[session]) {
      socket.send(this.responseWrapperStr(roundRes, 'endRound'));
      if (roundRes.endGame) socket.close();
    }
    if (!roundRes.endGame) return this.startNewRound(session);
    await this.sessionHandler.removeSession(session);
    delete this.sessions[session];
  }

  private parseTileData(tile: TileData): DominoTile {
    if (!tile) throw GameSessionError.badRequest();
    const { left, right }: TileData = tile;
    const leftParsed: number = parseInt(left, 10);
    const rightParsed: number = parseInt(right, 10);
    if (isNaN(leftParsed) || isNaN(rightParsed))
      throw GameSessionError.badRequest();
    const invalidLeftValue: boolean = leftParsed < 0 || leftParsed > 6;
    const invalidRightValue: boolean = rightParsed < 0 || rightParsed > 6;
    if (invalidLeftValue || invalidRightValue)
      throw GameSessionError.badRequest();
    return DominoTile.of(leftParsed as EndValue, rightParsed as EndValue);
  }

  private async startNewRound(session: string): Promise<void> {
    const delay: number = 1000;
    await setTimeout(delay);
    const decksInfo: DecksInfoRes[] = await this.sessionHandler.roundSetup(session);
    this.notifyPlayers(session, decksInfo, 'roundStart');
    await setTimeout(delay);
    const firstMoveInfo: MoveRes[] = await this.sessionHandler.firstMove(session);
    this.notifyPlayers(session, firstMoveInfo, 'firstMove');
    this.nextPlayerMove(session);
  }

  private async nextPlayerMove(
    session: string,
    previous: PlayerName = null
  ): Promise<void> {
    const delay = 1000;
    await setTimeout(delay);
    const nextPlayer: PlayerName = await this.sessionHandler.setNextPlayer(session);
    const nextMoveInfo: NextMoveRes = { name: nextPlayer };
    if (previous) nextMoveInfo.skippedBy = previous;
    for (const { socket } of this.sessions[session])
      socket.send(this.responseWrapperStr(nextMoveInfo, 'nextMove'));
    this.handleMoveState(session, nextPlayer);
  }

  private async handleMoveState(
    session: string,
    player: PlayerName
  ): Promise<void> {
    const moveState: MoveState =
      await this.sessionHandler.ableToPlay(session, player);
    if (moveState === MoveState.SKIPPABLE)
      this.nextPlayerMove(session, player);
    else if (moveState === MoveState.DEAD_END)
      this.endRound(session, true);
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
