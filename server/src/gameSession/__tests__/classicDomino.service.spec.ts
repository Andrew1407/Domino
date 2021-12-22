import ClassicDominoService from '../classicDomino.service'
import DominoTile, { TilesDeck } from '../entities/DominoTile';
import { PlayerName } from '../entities/Player';
import MoveState from '../playMode/MoveState';
import { FirstMoveResult, MoveOption, PlayersDecks } from '../playMode/PlayMode';

type testDataDistTiles = {
  playersNumber: number,
  players: PlayerName[],
  deck: TilesDeck,
  expPlayerDeckSize: number,
  expLeftDeckSize: number,
}

type testDataFirstMove = {
  playersNumber: number,
  playersDecks: PlayersDecks,
  expected: FirstMoveResult,
}

type testDataMovePermission = {
  target: DominoTile,
  comparable: DominoTile,
  side: MoveOption,
}

type testDataAbleToPlay = {
  playersNumber?: number,
  currentPlayer: PlayerName,
  playerDecks: PlayersDecks,
  stockSize: number,
  ends: TilesDeck,
  expected?: MoveState,
}

describe('classic (traditional) domino class', (): void => {
  const rulesHandler: ClassicDominoService = new ClassicDominoService();

  describe('createDeck', (): void => {
    const expectedDeck: TilesDeck = [
      DominoTile.of(0, 0),
      DominoTile.of(1, 0),
      DominoTile.of(1, 1),
      DominoTile.of(2, 0),
      DominoTile.of(2, 1),
      DominoTile.of(2, 2),
      DominoTile.of(3, 0),
      DominoTile.of(3, 1),
      DominoTile.of(3, 2),
      DominoTile.of(3, 3),
      DominoTile.of(4, 0),
      DominoTile.of(4, 1),
      DominoTile.of(4, 2),
      DominoTile.of(4, 3),
      DominoTile.of(4, 4),
      DominoTile.of(5, 0),
      DominoTile.of(5, 1),
      DominoTile.of(5, 2),
      DominoTile.of(5, 3),
      DominoTile.of(5, 4),
      DominoTile.of(5, 5),
      DominoTile.of(6, 0),
      DominoTile.of(6, 1),
      DominoTile.of(6, 2),
      DominoTile.of(6, 3),
      DominoTile.of(6, 4),
      DominoTile.of(6, 5),
      DominoTile.of(6, 6),
    ];
  
    it('should generate the same deck as expected', (): void => {
      const result: TilesDeck = rulesHandler.createDeck();
      expect(result).toHaveLength(expectedDeck.length);
      expect(result).toStrictEqual(expectedDeck);
    })
  })

  describe('distributeTiles', (): void => {
    const deck: TilesDeck = rulesHandler.createDeck();

    const testData: testDataDistTiles[] = [
      {
        playersNumber: 2,
        players: ['Bobo', 'Mavun'],
        deck,
        expPlayerDeckSize: 7,
        expLeftDeckSize: 14,
      },
      {
        playersNumber: 3,
        players: ['Bobo', 'Mavun', 'Sasik'],
        deck,
        expPlayerDeckSize: 5,
        expLeftDeckSize: 13,
      },
      {
        playersNumber: 4,
        players: ['Bobo', 'Mavun', 'Sasik', 'Ruzur'],
        deck,
        expPlayerDeckSize: 5,
        expLeftDeckSize: 8,
      },
    ];

    it.each(testData)(
      'should pick tiles from deck for $playersNumber players',
      ({ players, deck, expPlayerDeckSize, expLeftDeckSize }: testDataDistTiles): void => {
        const [ gotTiles, remainingTiles ]: [PlayersDecks, TilesDeck] =
          rulesHandler.distributeTiles(players, deck);
        expect(remainingTiles).toHaveLength(expLeftDeckSize);
        for (const player in gotTiles)
          expect(gotTiles[player]).toHaveLength(expPlayerDeckSize);
      }
    );
  })

  describe('pickFirstMove', (): void => {
    const testDataForDouble: testDataFirstMove[] = [
      {
        playersNumber: 2,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 0),
            DominoTile.of(0, 2),
            DominoTile.of(3, 6),
            DominoTile.of(1, 4),
            DominoTile.of(5, 6),
            DominoTile.of(2, 4),
            DominoTile.of(1, 5),
          ],
          Mavun: [
            DominoTile.of(5, 5),
            DominoTile.of(4, 4),
            DominoTile.of(3, 5),
            DominoTile.of(1, 6),
            DominoTile.of(3, 3),
            DominoTile.of(2, 5),
            DominoTile.of(2, 2),
          ],
        },
        expected: [
          'Mavun',
          DominoTile.of(5, 5),
          {
            Bobo: [
              DominoTile.of(0, 0),
              DominoTile.of(0, 2),
              DominoTile.of(3, 6),
              DominoTile.of(1, 4),
              DominoTile.of(5, 6),
              DominoTile.of(2, 4),
              DominoTile.of(1, 5),
            ],
            Mavun: [
              DominoTile.of(4, 4),
              DominoTile.of(3, 5),
              DominoTile.of(1, 6),
              DominoTile.of(3, 3),
              DominoTile.of(2, 5),
              DominoTile.of(2, 2),
            ],
          },
        ],
      },
      {
        playersNumber: 3,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 0),
            DominoTile.of(0, 2),
            DominoTile.of(3, 6),
            DominoTile.of(1, 4),
            DominoTile.of(5, 6),
          ],
          Mavun: [
            DominoTile.of(3, 5),
            DominoTile.of(1, 6),
            DominoTile.of(3, 3),
            DominoTile.of(2, 5),
            DominoTile.of(2, 2),
          ],
          Sasik: [
            DominoTile.of(2, 4),
            DominoTile.of(1, 5),
            DominoTile.of(6, 6),
            DominoTile.of(4, 4),
            DominoTile.of(4, 6),
          ],
        },
        expected: [
          'Sasik',
          DominoTile.of(6, 6),
          {
            Bobo: [
              DominoTile.of(0, 0),
              DominoTile.of(0, 2),
              DominoTile.of(3, 6),
              DominoTile.of(1, 4),
              DominoTile.of(5, 6),
            ],
            Mavun: [
              DominoTile.of(3, 5),
              DominoTile.of(1, 6),
              DominoTile.of(3, 3),
              DominoTile.of(2, 5),
              DominoTile.of(2, 2),
            ],
            Sasik: [
              DominoTile.of(2, 4),
              DominoTile.of(1, 5),
              DominoTile.of(4, 4),
              DominoTile.of(4, 6),
            ],
          },
        ],
      },
      {
        playersNumber: 4,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 0),
            DominoTile.of(0, 2),
            DominoTile.of(3, 6),
            DominoTile.of(1, 4),
            DominoTile.of(5, 6),
          ],
          Mavun: [
            DominoTile.of(3, 5),
            DominoTile.of(1, 6),
            DominoTile.of(3, 3),
            DominoTile.of(2, 5),
            DominoTile.of(2, 2),
          ],
          Sasik: [
            DominoTile.of(2, 4),
            DominoTile.of(1, 5),
            DominoTile.of(5, 5),
            DominoTile.of(4, 4),
            DominoTile.of(4, 6),
          ],
          Ruzur: [
            DominoTile.of(6, 6),
            DominoTile.of(2, 6),
            DominoTile.of(1, 3),
            DominoTile.of(1, 1),
            DominoTile.of(0, 6),
          ],
        },
        expected: [
          'Ruzur',
          DominoTile.of(6, 6),
          {
            Bobo: [
              DominoTile.of(0, 0),
              DominoTile.of(0, 2),
              DominoTile.of(3, 6),
              DominoTile.of(1, 4),
              DominoTile.of(5, 6),
            ],
            Mavun: [
              DominoTile.of(3, 5),
              DominoTile.of(1, 6),
              DominoTile.of(3, 3),
              DominoTile.of(2, 5),
              DominoTile.of(2, 2),
            ],
            Sasik: [
              DominoTile.of(2, 4),
              DominoTile.of(1, 5),
              DominoTile.of(5, 5),
              DominoTile.of(4, 4),
              DominoTile.of(4, 6),
            ],
            Ruzur: [
              DominoTile.of(2, 6),
              DominoTile.of(1, 3),
              DominoTile.of(1, 1),
              DominoTile.of(0, 6),
            ],
          },
        ],
      },
    ];

    const testDataForMaxSum: testDataFirstMove[] = [
      {
        playersNumber: 2,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 1),
            DominoTile.of(0, 2),
            DominoTile.of(3, 6),
            DominoTile.of(1, 4),
            DominoTile.of(5, 6),
            DominoTile.of(2, 4),
            DominoTile.of(1, 5),
          ],
          Mavun: [
            DominoTile.of(2, 5),
            DominoTile.of(2, 4),
            DominoTile.of(3, 5),
            DominoTile.of(1, 6),
            DominoTile.of(1, 3),
            DominoTile.of(2, 5),
            DominoTile.of(2, 6),
          ],
        },
        expected: [
          'Bobo',
          DominoTile.of(5, 6),
          {
            Bobo: [
              DominoTile.of(0, 1),
              DominoTile.of(0, 2),
              DominoTile.of(3, 6),
              DominoTile.of(1, 4),
              DominoTile.of(2, 4),
              DominoTile.of(1, 5),
            ],
            Mavun: [
              DominoTile.of(2, 5),
              DominoTile.of(2, 4),
              DominoTile.of(3, 5),
              DominoTile.of(1, 6),
              DominoTile.of(1, 3),
              DominoTile.of(2, 5),
              DominoTile.of(2, 6),
            ],
          },
        ],
      },
      {
        playersNumber: 3,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 1),
            DominoTile.of(0, 2),
            DominoTile.of(3, 6),
            DominoTile.of(1, 4),
            DominoTile.of(4, 6),
          ],
          Mavun: [
            DominoTile.of(3, 5),
            DominoTile.of(1, 6),
            DominoTile.of(2, 3),
            DominoTile.of(2, 5),
            DominoTile.of(2, 6),
          ],
          Sasik: [
            DominoTile.of(2, 4),
            DominoTile.of(1, 5),
            DominoTile.of(3, 6),
            DominoTile.of(3, 4),
            DominoTile.of(4, 5),
          ],
        },
        expected: [
          'Bobo',
          DominoTile.of(4, 6),
          {
            Bobo: [
              DominoTile.of(0, 1),
              DominoTile.of(0, 2),
              DominoTile.of(3, 6),
              DominoTile.of(1, 4),
            ],
            Mavun: [
              DominoTile.of(3, 5),
              DominoTile.of(1, 6),
              DominoTile.of(2, 3),
              DominoTile.of(2, 5),
              DominoTile.of(2, 6),
            ],
            Sasik: [
              DominoTile.of(2, 4),
              DominoTile.of(1, 5),
              DominoTile.of(3, 6),
              DominoTile.of(3, 4),
              DominoTile.of(4, 5),
            ],
          },
        ],
      },
      {
        playersNumber: 4,
        playersDecks: {
          Bobo: [
            DominoTile.of(0, 1),
            DominoTile.of(0, 2),
            DominoTile.of(0, 3),
            DominoTile.of(0, 4),
            DominoTile.of(0, 5),
          ],
          Mavun: [
            DominoTile.of(0, 6),
            DominoTile.of(1, 2),
            DominoTile.of(1, 3),
            DominoTile.of(1, 4),
            DominoTile.of(1, 5),
          ],
          Sasik: [
            DominoTile.of(1, 6),
            DominoTile.of(2, 3),
            DominoTile.of(2, 4),
            DominoTile.of(2, 5),
            DominoTile.of(2, 6),
          ],
          Ruzur: [
            DominoTile.of(3, 4),
            DominoTile.of(3, 5),
            DominoTile.of(3, 6),
            DominoTile.of(4, 5),
            DominoTile.of(4, 6),
          ],
        },
        expected: [
          'Ruzur',
          DominoTile.of(4, 6),
          {
            Bobo: [
              DominoTile.of(0, 1),
              DominoTile.of(0, 2),
              DominoTile.of(0, 3),
              DominoTile.of(0, 4),
              DominoTile.of(0, 5),
            ],
            Mavun: [
              DominoTile.of(0, 6),
              DominoTile.of(1, 2),
              DominoTile.of(1, 3),
              DominoTile.of(1, 4),
              DominoTile.of(1, 5),
            ],
            Sasik: [
              DominoTile.of(1, 6),
              DominoTile.of(2, 3),
              DominoTile.of(2, 4),
              DominoTile.of(2, 5),
              DominoTile.of(2, 6),
            ],
            Ruzur: [
              DominoTile.of(3, 4),
              DominoTile.of(3, 5),
              DominoTile.of(3, 6),
              DominoTile.of(4, 5),
            ],
          },
        ],
      },
    ];

    it.each(testDataForDouble)(
      'should pick a player and a double tile for the first move ($playersNumber players)',
      ({ playersDecks, expected }: testDataFirstMove): void => {
        const result: FirstMoveResult = rulesHandler.pickFirstMove(playersDecks);
        expect(result).toStrictEqual(expected);
      }
    );

    it.each(testDataForMaxSum)(
      'should pick a max tile when there is no double ($playersNumber players)',
      ({ playersDecks, expected }: testDataFirstMove): void => {
        const result: FirstMoveResult = rulesHandler.pickFirstMove(playersDecks);
        expect(result).toStrictEqual(expected);
      }
    );
  })

  describe('checkMovePermission', (): void => {
    const testDataTruthy: testDataMovePermission[] = [
      {
        target: DominoTile.of(3, 4),
        comparable: DominoTile.of(1, 4),
        side: 'right',
      },
      {
        target: DominoTile.of(4, 0),
        comparable: DominoTile.of(1, 4),
        side: 'right',
      },
      {
        target: DominoTile.of(4, 4),
        comparable: DominoTile.of(1, 4),
        side: 'right',
      },
      {
        target: DominoTile.of(0, 5),
        comparable: DominoTile.of(5, 2),
        side: 'left',
      },
      {
        target: DominoTile.of(5, 6),
        comparable: DominoTile.of(5, 2),
        side: 'left',
      },
      {
        target: DominoTile.of(5, 5),
        comparable: DominoTile.of(5, 2),
        side: 'left',
      },
    ];

    const testDataFalsy: testDataMovePermission[] = [
      {
        target: DominoTile.of(3, 4),
        comparable: DominoTile.of(1, 2),
        side: 'left',
      },
      {
        target: DominoTile.of(5, 1),
        comparable: DominoTile.of(3, 2),
        side: 'left',
      },
      {
        target: DominoTile.of(4, 4),
        comparable: DominoTile.of(3, 2),
        side: 'left',
      },
      {
        target: DominoTile.of(4, 0),
        comparable: DominoTile.of(1, 6),
        side: 'right',
      },
      {
        target: DominoTile.of(3, 2),
        comparable: DominoTile.of(1, 6),
        side: 'right',
      },
      {
        target: DominoTile.of(5, 5),
        comparable: DominoTile.of(1, 6),
        side: 'right',
      },
    ];

    it.each(testDataTruthy)(
      'should return true when tiles are compatible (target: $target, comparable: $comparable)',
      ({ target, comparable, side }: testDataMovePermission): void => {
        const result: boolean = rulesHandler
          .checkMovePermission(target, comparable, side);
        expect(result).toBeTruthy();
      });

      it.each(testDataFalsy)(
        'should return false when tiles are not compatible (target: $target, comparable: $comparable)',
        ({ target, comparable, side }: testDataMovePermission): void => {
          const result: boolean = rulesHandler
            .checkMovePermission(target, comparable, side);
          expect(result).toBeFalsy();
        });
  })

  describe('able to play', (): void => {
    it(
      'should determine that player is able to make moves if stock is not empty',
      (): void => {
        const testData: testDataAbleToPlay = {
          currentPlayer: 'Ruzur',
          playerDecks: {
            Ruzur: [DominoTile.of(0, 1), DominoTile.of(3, 4)],
            Sasik: [DominoTile.of(3, 2), DominoTile.of(6, 6)]
          },
          stockSize: 2,
          ends: [DominoTile.of(2, 1), DominoTile.of(4, 5)],
        }
        const result: MoveState = rulesHandler.ableToPlay(
          testData.currentPlayer,
          testData.playerDecks,
          testData.stockSize,
          testData.ends
        )
        expect(result).toEqual(MoveState.AVAILABLE);
      }
    );

    it('should be available if player has a tile to continue', (): void => {
      const testData: testDataAbleToPlay = {
        currentPlayer: 'Ruzur',
        playerDecks: {
          Ruzur: [DominoTile.of(0, 1), DominoTile.of(3, 5)],
          Sasik: [DominoTile.of(3, 2), DominoTile.of(6, 6)]
        },
        stockSize: 0,
        ends: [DominoTile.of(2, 1), DominoTile.of(4, 5)],
      }
      const result: MoveState = rulesHandler.ableToPlay(
        testData.currentPlayer,
        testData.playerDecks,
        testData.stockSize,
        testData.ends
      )
      expect(result).toEqual(MoveState.AVAILABLE);
    });

    it(
      'should be skippable if someone is able to make a move (except player)',
      (): void => {
        const testData: testDataAbleToPlay = {
          currentPlayer: 'Ruzur',
          playerDecks: {
            Ruzur: [DominoTile.of(0, 1), DominoTile.of(3, 4)],
            Sasik: [DominoTile.of(3, 2), DominoTile.of(6, 6)],
            Bobo: [DominoTile.of(3, 1), DominoTile.of(1, 1)],
          },
          stockSize: 0,
          ends: [DominoTile.of(2, 1), DominoTile.of(4, 5)],
        }
        const result: MoveState = rulesHandler.ableToPlay(
          testData.currentPlayer,
          testData.playerDecks,
          testData.stockSize,
          testData.ends
        )
        expect(result).toEqual(MoveState.SKIPPABLE);
      }
    );

    it('should be dead end if nobody is able to make a move', (): void => {
      const testData: testDataAbleToPlay = {
        currentPlayer: 'Ruzur',
        playerDecks: {
          Ruzur: [DominoTile.of(0, 1), DominoTile.of(3, 4)],
          Sasik: [DominoTile.of(3, 3), DominoTile.of(6, 6)],
          Bobo: [DominoTile.of(3, 0), DominoTile.of(1, 1)],
        },
        stockSize: 0,
        ends: [DominoTile.of(2, 1), DominoTile.of(4, 5)],
      }
      const result: MoveState = rulesHandler.ableToPlay(
        testData.currentPlayer,
        testData.playerDecks,
        testData.stockSize,
        testData.ends
      )
      expect(result).toEqual(MoveState.DEAD_END);
    })
  })
})
