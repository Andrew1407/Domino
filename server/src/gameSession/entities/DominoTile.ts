export type TileValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DominoTile = [TileValue, TileValue];
export type TilesDeck = DominoTile[];
// export type TileEnd = { value: TileValue, free: boolean };

// export default class DominoTile {
//   private readonly firstEnd: TileEnd;
//   private readonly secondEnd: TileEnd;

//   constructor(firstEnd: TileValue, secondEnd: TileValue) {
//     const free: boolean = true;
//     this.firstEnd = { value: firstEnd, free };
//     this.secondEnd = { value: secondEnd, free };
//   }
  
//   get isDouble(): boolean {
//     return this.firstEnd.value === this.secondEnd.value;
//   }

//   get ends(): [TileEnd, TileEnd] {
//     return [
//       { ...this.firstEnd },
//       { ...this.secondEnd }
//     ];
//   }

//   public occupy()
// }
