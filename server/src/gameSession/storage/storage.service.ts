import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import DominoTile, { EndValue, TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import { MoveOption, PlayersDecks } from '../playMode/PlayMode';
import { PlayersScore } from '../playMode/ScoreKeeper';
import { REDIS_CLIENT } from './storage.options';
import StorageClient, { SessionData, TileOptions } from './StorageClient';

@Injectable()
export default class StorageService implements OnApplicationShutdown, StorageClient {
  public static client(options = {}) {
    return createClient(options);
  }

  private readonly prefix: string = 'domino';

  constructor(@Inject(REDIS_CLIENT) private readonly dbClient: RedisClientType) {}

  public onApplicationShutdown(): void {
    this.dbClient?.quit();
  }

  public async createSession(
    sessionId: string,
    score: number,
    players: number
  ): Promise<void> {
    const field: string = this.prefixedNamespace('sessions', sessionId);
    await Promise.all([
      this.dbClient.HSET(field, 'score', score),
      this.dbClient.HSET(field, 'players', players),
      this.dbClient.HSET(field, 'round', 1),
    ]);
  }

  public async sessionExists(sessionId: string): Promise<boolean> {
    const field: string = this.prefixedNamespace('sessions', sessionId);
    return this.dbClient.EXISTS(field);
  }

  public async nextRound(sessionId: string): Promise<void> {
    const sessionField: string = this.prefixedNamespace('sessions', sessionId);
    const currentRound: number = parseInt(await this.dbClient.HGET(sessionField, 'round'), 10);
    await this.dbClient.HSET(sessionField, 'round', currentRound + 1);
    await this.clearSessionData(sessionId);
  }

  public async getSessionData(sessionId: string): Promise<SessionData> {
    const field: string = this.prefixedNamespace('sessions', sessionId);
    type SessionDataRaw = {
      score: string,
      players: string,
      round: string,
      current_move?: PlayerName
    };
    const sessionDataRaw: SessionDataRaw = (await this.dbClient.HGETALL(field)) as SessionDataRaw;
    return {
      score: parseInt(sessionDataRaw.score, 10),
      players: parseInt(sessionDataRaw.players, 10),
      round: parseInt(sessionDataRaw.round, 10),
      current_move: sessionDataRaw.current_move as PlayerName
    };
  }

  public async setCurrentMove(sessionId: string, player: PlayerName): Promise<void> {
    const field: string = this.prefixedNamespace('sessions', sessionId);
    await this.dbClient.HSET(field, 'current_move', player);
  }

  public async getCurrentMove(sessionId: string): Promise<PlayerName> {
    const field: string = this.prefixedNamespace('sessions', sessionId);
    const player: string | null = await this.dbClient.HGET(field, 'current_move');
    if (!player) throw new Error('no such user exists');
    return player as PlayerName;
  }

  public async setStock(sessionId: string, deck: TilesDeck): Promise<void> {
    const field: string = this.prefixedNamespace('stock', sessionId);
    const stringified: string[] = this.stringifyTiles(deck)
    await this.dbClient.SADD(field, stringified);
  }

  public async getFromStock(sessionId: string): Promise<DominoTile> {
    const field: string = this.prefixedNamespace('stock', sessionId);
    const tile: string | null = await this.dbClient.SRANDMEMBER(field);
    if (!tile) throw new Error('there are no tiles in the stock');
    await this.dbClient.SREM(field, tile);
    return this.parseTile(tile);
  }

  public async getStockSize(sessionId: string): Promise<number> {
    const field: string = this.prefixedNamespace('stock', sessionId);
    return this.dbClient.SCARD(field);
  }

  public async setMoveAction(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    { side, reversed }: TileOptions
  ): Promise<void> {
    const playerDeckField: string = this.prefixedNamespace('player_deck', sessionId, player);
    const commonDeckField: string = this.prefixedNamespace('deck', sessionId);
    const stringified: string = tile.stringify();
    const removed: number = await this.dbClient.SREM(playerDeckField, stringified);
    if (removed !== 1) throw new Error('invalid deck entries');
    const command: string = side === 'left' ? 'LPUSH' : 'RPUSH';
    const tileToPush: string = reversed ? tile.copyReversed().stringify() : stringified;
    await this.dbClient[command](commonDeckField, tileToPush);
  }

  public async getDeckEnds(sessionId: string): Promise<TilesDeck> {
    const field: string = this.prefixedNamespace('deck', sessionId);
    const deckSize: number = await this.dbClient.LLEN(field);
    if (!deckSize) throw new Error('the deck is empty');
    const leftEndStr: string = await this.dbClient.LINDEX(field, 0);
    const leftEnd: DominoTile = this.parseTile(leftEndStr);
    if (deckSize === 1) return [leftEnd, leftEnd.copy()];
    const rightEndStr: string = await this.dbClient.LINDEX(field, -1);
    const rightEnd: DominoTile = this.parseTile(rightEndStr);
    return [leftEnd, rightEnd];
  }

  public async getPlayersScore(sessionId: string): Promise<PlayersScore> {
    const field: string = this.prefixedNamespace('players_score', sessionId);
    const score: Partial<{ [key in PlayerName] }> = await this.dbClient.HGETALL(field);
    for (const player in score) score[player] = parseInt(score[player], 10);
    return score;
  }

  public async setPlayerScore(
    sessionId: string,
    player: PlayerName,
    newScore: number
  ): Promise<void> {
    const field: string = this.prefixedNamespace('players_score', sessionId);
    await this.dbClient.HSET(field, player, newScore);
  }

  public async getPlayersDecks(sessionId: string): Promise<PlayersDecks> {
    const players: string[] = await this.getPlayersPaths(sessionId);
    type SearchResult = [PlayerName, TilesDeck];
    const found: SearchResult[] = await Promise.all(
      players.map((p: string): Promise<SearchResult> => this.searchUserDeck(p))
    );
    const foundReducer = (
      result: PlayersDecks,
      [player, deck]: SearchResult
    ): PlayersDecks => ({
      ...result, [player]: deck
    });
    return found.reduce(foundReducer, {});
  }

  public async setPlayerDeck(
    sessionId: string,
    player: PlayerName,
    deck: TilesDeck
  ): Promise<void> {
    const field: string = this.prefixedNamespace('player_deck', sessionId, player);
    await this.dbClient.SADD(field, this.stringifyTiles(deck));
  }

  public async getSessionPlayers(sessionId: string): Promise<PlayerName[]> {
    const field: string = this.prefixedNamespace('players_score', sessionId);
    const players: string[] = await this.dbClient.HKEYS(field);
    return players as PlayerName[];
  }

  public async removeSession(sessionId: string): Promise<void> {
    const sessionField: string = this.prefixedNamespace('sessions', sessionId);
    const playersScoreField: string = this.prefixedNamespace('players_score', sessionId);
    await this.clearSessionData(sessionId);
    await this.dbClient.DEL([sessionField, playersScoreField]);
  }

  public async playerDeckEmpty(
    sessionId: string,
    player: PlayerName
  ): Promise<boolean> {
    const field: string =
      this.prefixedNamespace('player_deck', sessionId, player);
    const size: number = await this.dbClient.SCARD(field);
    return size === 0;
  }

  public async removePlayerScore(sessionId: string, player: PlayerName): Promise<void> {
    const field: string = this.prefixedNamespace('players_score', sessionId);
    await this.dbClient.HDEL(field, player);
  }

  public async getCommonDeck(sessionId: string): Promise<TilesDeck> {
    const field: string = this.prefixedNamespace('deck', sessionId);
    const stringified: string[] = await this.dbClient.LRANGE(field, 0, -1);
    return stringified.map((t: string): DominoTile => this.parseTile(t));
  }

  private async clearSessionData(sessionId: string): Promise<void> {
    const fields: string[] = ['stock', 'deck'];
    const removable: string[] = await this.getPlayersPaths(sessionId);
    for (const field of fields)
      removable.push(this.prefixedNamespace(field, sessionId));
    await this.dbClient.DEL(removable);
  }

  private async getPlayersPaths(sessionId: string): Promise<string[]> {
    const players: string[] = await this.getSessionPlayers(sessionId);
    return players.map(
      (p: string): string => this.prefixedNamespace('player_deck', sessionId, p)
    );
  }

  private async searchUserDeck (playerField: string): Promise<[PlayerName, TilesDeck]> {
    const deckStr: string[] = await this.dbClient.SMEMBERS(playerField);
    const deck: TilesDeck = deckStr.map((t: string): DominoTile => this.parseTile(t));
    const player: PlayerName = playerField.split(':').pop() as PlayerName;
    return [player, deck];
  };

  private parseTile(stringified: string): DominoTile {
    const { left, right }: { left: EndValue, right: EndValue } = JSON.parse(stringified);
    return DominoTile.of(left, right);
  }

  private stringifyTiles(tiles: TilesDeck): string[] {
    return tiles.map((t: DominoTile): string => t.stringify());
  }

  private prefixedNamespace(...args: string[]): string {
    return [this.prefix, ...args].join(':');
  }
}
