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

  nextRound(sessionId: string): Promise<void>;

  getSessionData(sessionId: string): Promise<SessionData>;

  setCurrentMove(sessionId: string, player: PlayerName): Promise<void>;

  getCurrentMove(sessionId: string): Promise<PlayerName>;

  setStock(sessionId: string, deck: TilesDeck): Promise<void>;

  getFromStock(sessionId: string): Promise<DominoTile>;

  getStockSize(sessionId: string): Promise<number>;

  setMoveAction(
    sessionId: string,
    player: PlayerName,
    tile: DominoTile,
    side: MoveOption
  ): Promise<void>;

  getDeckEnds(sessionId: string): Promise<TilesDeck>;

  getPlayersScore(sessionId: string): Promise<PlayersScore>;

  setPlayerScore(sessionId: string, player: PlayerName, newScore: number): Promise<void>;

  setDeck(sessionId: string, deck: TilesDeck): Promise<void>;

  getPlayersDecks(sessionId: string): Promise<PlayersDecks>;

  removeSession(sessionId: string): Promise<void>;
}
