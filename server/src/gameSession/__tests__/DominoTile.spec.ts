import DominoTile, { EndValue } from '../entities/DominoTile';

describe('new instance (of)', (): void => {
  it.each([
    [1, 2],
    [2, 2],
    [2, 3],
    [3, 3],
  ])(
    'should create new instance with left = %i, right = %i',
    (left: EndValue, right: EndValue): void => {
      const newTile = new DominoTile(left, right);
      const newTileOf = DominoTile.of(left, right);

      expect(newTile.left).toEqual(left);
      expect(newTile.right).toEqual(right);
      expect(newTileOf.left).toEqual(left);
      expect(newTileOf.right).toEqual(right);
    }
  );
});

describe('isDouble', (): void => {
  it.each([
    DominoTile.of(0, 0),
    DominoTile.of(1, 1),
    DominoTile.of(2, 2),
    DominoTile.of(3, 3),
    DominoTile.of(4, 4),
    DominoTile.of(5, 5),
    DominoTile.of(6, 6),
  ])(
    'should check if double for ends: left = $left, right = $right',
    (tile: DominoTile): void => {
      expect(tile.isDouble()).toBeTruthy();
    }
  );

  it.each([
    DominoTile.of(0, 1),
    DominoTile.of(4, 1),
    DominoTile.of(6, 5),
    DominoTile.of(2, 5),
    DominoTile.of(1, 6),
    DominoTile.of(5, 4),
    DominoTile.of(6, 2),
  ])(
    'should check if not double for ends: left = $left, right = $right',
    (tile: DominoTile): void => {
      expect(tile.isDouble()).toBeFalsy();
    }
  );
});

describe('tileSum', (): void => {
  it.each([
    [0, 0, 0],
    [1, 1, 2],
    [6, 5, 11],
    [5, 5, 10],
    [6, 6, 12],
    [5, 4, 9],
    [3, 2, 5],
  ])(
    'should sum tile\'s end (left = %i, right = %i), sum = %i',
    (left: EndValue, right: EndValue, expected: number): void => {
      const tile: DominoTile = DominoTile.of(left, right);
      expect(tile.tileSum()).toEqual(expected);
    }
  );
})

describe('copy', (): void => {
  it.each([
    DominoTile.of(0, 0),
    DominoTile.of(1, 1),
    DominoTile.of(2, 2),
    DominoTile.of(3, 3),
    DominoTile.of(4, 4),
    DominoTile.of(5, 5),
    DominoTile.of(6, 6),
  ])(
    'should copy the tile (left = $left, right = $right) in a new object',
    (tile: DominoTile): void => {
      const copy: DominoTile = tile.copy();
      expect(copy.left).toEqual(tile.left);
      expect(copy.right).toEqual(tile.right);
      expect(copy).not.toBe(tile);
    }
  );
});

describe('copyReversed', (): void => {
  it.each([
    DominoTile.of(0, 0),
    DominoTile.of(1, 1),
    DominoTile.of(2, 2),
    DominoTile.of(3, 3),
    DominoTile.of(4, 4),
    DominoTile.of(5, 5),
    DominoTile.of(6, 6),
  ])(
    'should copy and reverse the tile\'s ends (left = $left, right = $right) in a new object',
    (tile: DominoTile): void => {
      const reversed: DominoTile = tile.copyReversed();
      expect(reversed.left).toEqual(tile.right);
      expect(reversed.right).toEqual(tile.left);
      expect(reversed).not.toBe(tile);
    }
  );

  describe('stringify', (): void => {
    it.each([
      [new DominoTile(3, 6), '{"left":3,"right":6}'],
      [DominoTile.of(2, 2), '{"left":2,"right":2}'],
    ])('should convert tiles to string', (tile: DominoTile, expected: string) => {
      expect(tile.stringify()).toEqual(expected);
    })
  });
});

