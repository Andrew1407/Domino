import DominoTile, { TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import { MoveOption, PlayersDecks } from '../playMode/PlayMode';
import { PlayersScore } from '../playMode/ScoreKeeper';

export type SessionData = {
  score: number,
  players: number,
  round: number,
  current_move?: PlayerName
};

export default interface StorageClient {
  createSession(sessionId: string, score: number, players: number): Promise<void>;

  sessionExists(sessionId: string): Promise<boolean>;

  nextRound(sessionId: string): Promise<void>;

  getSessionData(sessionId: string): Promise<SessionData>;

  setCurrentMove(sessionId: string, player: PlayerName): Promise<void>;

  getCurrentMove(sessionId: string): Promise<PlayerName>;

  setStock(sessionId: string, deck: TilesDeck): Promise<void>;

  getFromStock(sessionId: string): Promise<DominoTile>;

  getStockSize(sessionId: string): Promise<number>;

  getCommonDeck(sessionId: string): Promise<TilesDeck>;

  setMoveAction(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    side: MoveOption,
    reversed: boolean
  ): Promise<void>;

  getDeckEnds(sessionId: string): Promise<TilesDeck>;

  getPlayersScore(sessionId: string): Promise<PlayersScore>;

  setPlayerScore(sessionId: string, player: PlayerName, newScore: number): Promise<void>;

  removePlayerScore(sessionId: string, player: PlayerName): Promise<void>;

  getPlayersDecks(sessionId: string): Promise<PlayersDecks>;

  setPlayerDeck(
    sessionId: string,
    player: PlayerName,
    deck: TilesDeck
  ): Promise<void>;

  getSessionPlayers(sessionId: string): Promise<PlayerName[]>;

  removeSession(sessionId: string): Promise<void>;

  playerDeckEmpty(sessionId: string, player: PlayerName): Promise<boolean>;
}
