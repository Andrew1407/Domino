import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import DominoTile, { TilesDeck } from './entities/DominoTile';
import { availablePlayers, PlayerName } from './entities/Player';
import { CLASSIC_DOMINO_SERVICE, SCORE_KEEPER_SERVICE } from './gameSession.options';
import MoveState from './playMode/MoveState';
import PlayMode, { FirstMoveResult, MoveOption, PlayersDecks } from './playMode/PlayMode';
import ScoreKeeper, { PlayersScore } from './playMode/ScoreKeeper';
import { STORAGE_CLIENT } from './storage/storage.options';
import StorageClient, { SessionData } from './storage/StorageClient';
import GameSessionError from './wsTools/GameSessionError';
import { DecksInfoRes, PlayerRes, MoveRes, RoundRes } from './wsTools/responseTypes';

@Injectable()
export default class GameSessionService {
  constructor(
    @Inject(STORAGE_CLIENT) private readonly storage: StorageClient,
    @Inject(CLASSIC_DOMINO_SERVICE) private readonly playMode: PlayMode,
    @Inject(SCORE_KEEPER_SERVICE) private readonly scoreKeeper: ScoreKeeper
  ) {}

  public async makeNewSession(
    players: number,
    finalScore: number
  ): Promise<string> {
    const invalidPlayersCount: boolean = players < 2 || players > 4;
    const invalidScore: boolean = finalScore <= 0 || finalScore >= 26_000_000;
    if (invalidPlayersCount || invalidScore) throw GameSessionError.badRequest();
    const sessionId: string = uuidv4();
    await this.storage.createSession(sessionId, finalScore, players);
    return sessionId;
  }

  public async joinSession(sessionId: string): Promise<PlayerRes> {
    await this.sessionExists(sessionId);
    const [ curPlayers, sessionData ]: [PlayerName[], SessionData] =
      await this.getPlayersData(sessionId);
    if (curPlayers.length === sessionData.players)
      throw GameSessionError.playersLimit();
    const name: PlayerName = this.pickName(curPlayers);
    await this.storage.setPlayerScore(sessionId, name, 0);
    const scores: PlayersScore = await this.storage.getPlayersScore(sessionId)
    return { ...sessionData, name, scores, };
  }

  public async shouldWaitForPlayers(sessionId: string): Promise<boolean> {
    await this.sessionExists(sessionId);
    const [ curPlayers, sessionData ]: [PlayerName[], SessionData] =
      await this.getPlayersData(sessionId);
    return curPlayers.length < sessionData.players;
  }

  public async roundSetup(sessionId: string): Promise<DecksInfoRes[]> {
    await this.sessionExists(sessionId);
    const players: PlayerName[] = await this.storage.getSessionPlayers(sessionId);
    const stockFull: TilesDeck = this.playMode.createDeck();
    const [ playersDecks, stock ] : [PlayersDecks, TilesDeck] =
      this.playMode.distributeTiles(players, stockFull);
    await Promise.all([
      this.storage.setStock(sessionId, stock),
      ...players.map((p: PlayerName): Promise<void> => (
        this.storage.setPlayerDeck(sessionId, p, playersDecks[p])
      )),
    ]);
    return this.formatResponseDecks(sessionId, playersDecks);
  }

  public async firstMove(sessionId: string): Promise<MoveRes[]> {
    await this.sessionExists(sessionId);
    const playersDecks: PlayersDecks =
      await this.storage.getPlayersDecks(sessionId);
    const [ firstPlayer, firstTile, playersDecksNew ]: FirstMoveResult =
      this.playMode.pickFirstMove(playersDecks);
    await Promise.all([
      this.storage.setCurrentMove(sessionId, firstPlayer),
      this.storage.setMoveAction(sessionId, firstPlayer, firstTile, 'right'),
    ]);
    return this.formatResponseMove(
      sessionId,
      firstPlayer,
      firstTile,
      playersDecksNew,
      ['deck']
    );
  }

  public async shouldMove(
    sessionId: string,
    player: PlayerName
  ): Promise<boolean> {
    await this.sessionExists(sessionId);
    await this.playerExists(sessionId, player);
    const currentPlayer: PlayerName = await this.storage.getCurrentMove(sessionId);
    return currentPlayer === player;
  }

  public async ableToMove(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    side: MoveOption
  ): Promise<boolean> {
    const [ premission ]: [boolean, DominoTile] =
      await this.getMoveActionParams(sessionId, player, tile, side);
    return premission;
  }

  public async moveAction(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    side: MoveOption
  ) : Promise<MoveRes[]> {
    const [ possible, comparable ]: [boolean, DominoTile] =
      await this.getMoveActionParams(sessionId, player, tile, side);
    if (!possible) throw GameSessionError.forbidden();
    const shouldBeReversed: boolean = side === 'left' ?
      comparable.left === tile.right :
      comparable.right === tile.left;
    const movedTile: DominoTile = shouldBeReversed ? tile.copyReversed() : tile;
    await this.storage.setMoveAction(sessionId, player, movedTile, side);
    const playersDecks: PlayersDecks = await this.storage.getPlayersDecks(sessionId);
    return this.formatResponseMove(
      sessionId,
      player,
      movedTile,
      playersDecks,
      ['deck']
    );
  }

  public async getFromStock(
    sessionId: string,
    player: PlayerName
  ): Promise<MoveRes[]> {
    await this.sessionExists(sessionId);
    await this.playerExists(sessionId, player);
    const [ playersDecks, tile ]: [PlayersDecks, DominoTile] =
      await Promise.all([
        this.storage.getPlayersDecks(sessionId),
        this.storage.getFromStock(sessionId),
      ]);
    await this.storage.setPlayerDeck(sessionId, player, [tile]);
    return this.formatResponseMove(
      sessionId,
      player,
      tile,
      playersDecks,
      ['deck', 'tile']
    );
  }

  public async ableToPlay(
    sessionId: string,
    player: PlayerName
  ): Promise<MoveState> {
    await this.sessionExists(sessionId);
    await this.playerExists(sessionId, player);
    const [playersDecks, stockSize, ends]: [PlayersDecks, number, TilesDeck] =
      await Promise.all([
        this.storage.getPlayersDecks(sessionId),
        this.storage.getStockSize(sessionId),
        this.storage.getDeckEnds(sessionId),
      ]);
    return this.playMode.ableToPlay(player, playersDecks, stockSize, ends);
  }

  public async setNextPlayer(sessionId: string): Promise<PlayerName> {
    await this.sessionExists(sessionId);
    const [ prevPlayer, allPlayers ]: [PlayerName, PlayerName[]] =
      await Promise.all([
        this.storage.getCurrentMove(sessionId),
        this.storage.getSessionPlayers(sessionId),
      ]);
    const nextIdx: number = allPlayers.indexOf(prevPlayer) + 1;
    const nextPlayer: PlayerName = allPlayers[nextIdx % allPlayers.length];
    await this.storage.setCurrentMove(sessionId, nextPlayer);
    return nextPlayer;
  }

  public outOfTiles(sessionId: string, player: PlayerName): Promise<boolean> {
    return this.storage.playerDeckEmpty(sessionId, player);
  }

  public async endRound(sessionId: string): Promise<RoundRes> {
    await this.sessionExists(sessionId);
    const [ playersDecks, playersScore, sessionData ]:
      [PlayersDecks, PlayersScore, SessionData] = await Promise.all([
      this.storage.getPlayersDecks(sessionId),
      this.storage.getPlayersScore(sessionId),
      this.storage.getSessionData(sessionId),
    ]);
    const newScore: PlayersScore =
      this.scoreKeeper.roundSumUp(playersDecks, playersScore);
    const roundRes: RoundRes = { ...sessionData, scores: newScore, endGame: false };
    if (newScore !== playersScore) {
      const winner: PlayerName = this.getRoundWinner(playersScore, newScore);
      roundRes.winner = winner
      await this.storage.setPlayerScore(sessionId, winner, newScore[winner]);
    }
    const sesionWinner: PlayerName | null =
      this.scoreKeeper.checkWinner(newScore, sessionData.score);
    if (sesionWinner) roundRes.endGame = true;
    else await this.storage.nextRound(sessionId);
    return roundRes;
  }

  public async removeSession(sessionId: string): Promise<void> {
    await this.sessionExists(sessionId);
    await this.storage.removeSession(sessionId);
  }

  public async removePlayer(sessionId: string, player: PlayerName): Promise<PlayerRes> {
    await this.sessionExists(sessionId);
    await this.playerExists(sessionId, player);
    await this.storage.removePlayerScore(sessionId, player);
    const [ sessionData, scores ]: [SessionData, PlayersScore] = await Promise.all([
      this.storage.getSessionData(sessionId),
      this.storage.getPlayersScore(sessionId),
    ]);
    return { ...sessionData, scores, name: player };
  }

  private getRoundWinner(oldScore: PlayersScore, newScore: PlayersScore): PlayerName {
    for (const player in oldScore)
      if (oldScore[player] === newScore[player])
        return player as PlayerName;

    return null;
  }

  private async sessionExists(sessionId: string): Promise<void> {
    const exists: boolean = await this.storage.sessionExists(sessionId);
    if (!exists) throw GameSessionError.notExists();
  }

  private async playerExists(
    sessionId: string,
    player: PlayerName
  ): Promise<void> {
    const players: PlayerName[] = await this.storage.getSessionPlayers(sessionId);
    if (!players.includes(player)) throw GameSessionError.forbidden();
  }

  private pickName(taken: PlayerName[]): PlayerName {
    const available: PlayerName[] = availablePlayers
      .filter((p: PlayerName): boolean => !taken.includes(p));
    const { length: size }: PlayerName[] = available;
    const i: number = size === 1 ? 0 : Math.floor(Math.random() * size);
    return available[i];
  }

  private async formatResponseMove(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    playersDecks: PlayersDecks,
    removable: (keyof MoveRes)[]
  ): Promise<MoveRes[]> {
    const decksInfo: DecksInfoRes[] =
      await this.formatResponseDecks(sessionId, playersDecks);
    const firstMoveInfo: MoveRes[] = [];
    for (const deckInfo of decksInfo) {
      const moveInfo: MoveRes = { ...deckInfo, tile, };
      if (moveInfo.name !== player)
        removable.forEach((key: keyof MoveRes): void => {
          delete moveInfo[key];
        });
      firstMoveInfo.push(moveInfo);
    }
    return firstMoveInfo;
  }

  private async getPlayersData(sessionId: string):
    Promise<[PlayerName[], SessionData]> {
    const curPlayers: PlayerName[] = await this.storage.getSessionPlayers(sessionId);
    const sessionData: SessionData = await this.storage.getSessionData(sessionId);
    return [curPlayers, sessionData];
  }

  private async formatResponseDecks(
    sessionId: string,
    playersDecks: PlayersDecks
  ): Promise<DecksInfoRes[]> {
    const [ sessionData, scores, stock ]: [SessionData, PlayersScore, number] =
      await Promise.all([
        this.storage.getSessionData(sessionId),
        this.storage.getPlayersScore(sessionId),
        this.storage.getStockSize(sessionId),
      ]);
    const playersData: DecksInfoRes[] = [];
    for (const player in playersDecks) {
      const tilesCount: PlayersScore = Object.entries(playersDecks)
        .filter(([p]: [PlayerName, TilesDeck]): boolean => p !== player)
        .reduce((
            acc: PlayersScore,
            [p, s]: [PlayerName, TilesDeck]
          ): PlayersScore => ({ ...acc, [p]: s.length }),
        {});
      playersData.push({
        ...sessionData,
        stock,
        scores,
        name: player as PlayerName,
        deck: playersDecks[player],
        tilesCount, 
      });
    }
    return playersData;
  }

  private async getMoveActionParams(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    side: MoveOption
  ): Promise<[boolean, DominoTile]> {
    await this.sessionExists(sessionId);
    await this.playerExists(sessionId, player);
    const deckEnds: TilesDeck = await this.storage.getDeckEnds(sessionId);
    const comparableIdx: number = side === 'left' ? 0 : 1;
    const comparable: DominoTile = deckEnds[comparableIdx];
    const moveEnabled: boolean = this.playMode.checkMovePermission(tile, comparable, side);
    return [moveEnabled, comparable];
  }
}
