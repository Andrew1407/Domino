import DominoTile, { TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import { PlayersScore } from '../playMode/ScoreKeeper';
import { SessionData } from '../storage/StorageClient';

export default interface ReqWS<T> {
  status: number,
  event: string,
  data: T
}

export interface JoinedPlayerRes extends SessionData {
  name: PlayerName,
  scores: PlayersScore
}

export interface DecksInfoRes extends JoinedPlayerRes {
  deck?: TilesDeck,
  tilesCount: PlayersScore
}

export interface MoveRes extends DecksInfoRes {
  tile?: DominoTile
}

export interface RoundRes extends SessionData {
  scores: PlayersScore,
  endGame: boolean,
  winner?: PlayerName
}
