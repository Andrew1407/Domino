import { DominoTile, TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import MoveState from './MoveState';

export type PlayersDecks = Partial<{ [key in PlayerName]: TilesDeck; }>;
export type MoveOption = 'left' | 'right';

export default interface PlayMode {
  createDeck(): TilesDeck;
  
  distributeTiles(
    players: PlayerName[],
    deck: TilesDeck
  ): [PlayersDecks, TilesDeck];
  
  pickFirstMove(playersDecks: PlayersDecks): [DominoTile, PlayersDecks];

  checkMovePermission(
    tile: DominoTile,
    comparable: DominoTile,
    side: MoveOption
  ): boolean;

  ableToPlay(
    currentPlayer: PlayerName,
    playersDecks: PlayersDecks,
    stock: TilesDeck,
    ends: TilesDeck
  ): MoveState;
}
