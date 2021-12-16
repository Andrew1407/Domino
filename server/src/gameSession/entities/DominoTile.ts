export type EndValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TilesDeck = DominoTile[];

export default class DominoTile {
  public static of(left: EndValue, right: EndValue): DominoTile {
    return new DominoTile(left, right);
  }
  
  constructor(
    public readonly left: EndValue,
    public readonly right: EndValue
  ) {}

  public isDouble(): boolean {
    return this.left === this.right;
  }

  public tileSum(): number {
    return this.left + this.right;
  }

  public copy(): DominoTile {
    return new DominoTile(this.left, this.right);
  }

  public copyReversed(): DominoTile {
    return new DominoTile(this.right, this.left);
  }
}
