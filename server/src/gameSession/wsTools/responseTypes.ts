import { WsResponse } from '@nestjs/websockets';
import DominoTile, { TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import { PlayersScore } from '../playMode/ScoreKeeper';
import { SessionData } from '../storage/StorageClient';

export default interface GameSessionRes<T> extends WsResponse<T> {
  errorStatus: string
}

export interface PlayerRes extends SessionData {
  name: PlayerName,
  scores: PlayersScore
}

export interface DecksInfoRes extends PlayerRes {
  deck?: TilesDeck,
  tilesCount: PlayersScore,
  stock: number
}

export interface MoveRes extends DecksInfoRes {
  tile?: DominoTile,
  commonDeck: TilesDeck
}

export interface RoundRes extends SessionData {
  scores: PlayersScore,
  endGame: boolean,
  winner?: PlayerName,
  deadEnd?: boolean 
}

export interface NameContainerRes {
  name: PlayerName
}

export interface MovePermissionRes {
  permission: boolean
}

export interface NextMoveRes extends NameContainerRes {
  skippedBy?: PlayerName
}
