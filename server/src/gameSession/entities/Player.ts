import { TilesDeck } from './DominoTile';

export type PlayerName = 'Bobo' | 'Sasik' | 'Mavun' | 'Ruzur';
export const availablePlayers: PlayerName[] = ['Bobo', 'Sasik', 'Mavun', 'Ruzur'];

export default interface Player {
  deck: TilesDeck;
  score: number;
}
