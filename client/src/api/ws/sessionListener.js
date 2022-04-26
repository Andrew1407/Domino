export default class SessionListener {
  #gameState = null;

  constructor(gameState) {
    this.#gameState = gameState;
  }

  error(data, status) {
    const errorMesasge = `${status}: ${data}`;
    this.#gameState?.setErrorMessage(errorMesasge);
  }

  interruptedSession(data) {
    const errorMesasge = data.name + ' interrupted the game session';
    this.#gameState?.setErrorMessage(errorMesasge);
  }

  moveCheck(data) {
    const { permission } = data;
    
  }

  joinSession(data) {
    this.#gameState?.setCurrentPlayer(data.name);
    this.#gameState?.setRoundInfo({
      players: data.players,
      finalScore: data.score,
      currentRound: data.round,
      stock: 0,
    });
    const playersData = Object.keys(data.scores).map(p => ({
      name: p, score: 0, tiles: 0
    }));
    this.#gameState?.setJoinedPlayers(playersData);
  }

  leaveSession(data) {
    this.#gameState?.removeJoinedPlayer(data.name);
    this.#gameState?.addToLog(`Player "${data.name}" has left the current session.`);
  }

  sessionNewcomer(data) {
    this.#gameState?.addJoinedPlayer(data.name);
    this.#gameState?.addToLog(`Player "${data.name}" has joined the current session.`);
  }

  moveAction(data) {
    if (data.deck) this.#gameState?.setPlayerDeck(data.deck);
    this.#gameState?.setCommonDeck(data.commonDeck);
    const logMessage = `Player "${data.current_move}" made a move with a tile ${JSON.stringify(data.tile)}.`;
    this.#setMainStateValues(data, logMessage);
  }

  fromStock(data) {
    if (data.deck) this.#gameState?.setPlayerDeck(data.deck);
    this.#gameState?.setCommonDeck(data.commonDeck);
    const logMessage = `Player "${data.current_move}" took a tile from the stock.`;
    this.#setMainStateValues(data, logMessage);
  }

  endRound(data) {
    const { winner, scores, endGame } = data;
    const winMessage = winner ?
      `Player ${winner} won the round with the score ${scores[winner]}.` :
      'The round ended with a draw.';
    this.#gameState?.addToLog(winMessage);

    if (endGame)
      this.#gameState?.addToLog(`Player ${winner} won the game with the score ${scores[winner]}.`);
  }

  roundStart(data) {
    this.#gameState?.setCurrentPlayer(data.name);
    this.#gameState?.setPlayerDeck(data.deck);
    const logMessage = `Round ${data.round} has started.`;
    this.#setMainStateValues(data, logMessage);
  }

  firstMove(data) {
    if (data.deck) this.#gameState?.setPlayerDeck(data.deck);
    this.#gameState?.setCommonDeck(data.commonDeck);
    const logMessage = `Player "${data.current_move}" made a first move with a tile ${JSON.stringify(data.tile)}.`;
    this.#setMainStateValues(data, logMessage);
  }

  nextMove(data) {
    const { name, skippedBy } = data;
    if (skippedBy)
      this.#gameState?.addToLog(`Player "${skippedBy}" is unable to make a move and skips it.`);
    this.#gameState?.setCurrentMove(name);
    this.#gameState?.addToLog(`The next move is for player "${name}"`);
  }

  #setMainStateValues(data, logMessage) {
    this.#gameState?.setRoundInfo({
      stock: data.stock,
      players: data.players,
      finalScore: data.score,
      currentRound: data.round,
      currentMove: data.current_move,
    });
    const playersData = Object.keys(data.tilesCount).map(p => ({
      name: p,
      score: data.scores[p],
      tiles: data.tilesCount[p],
    }));
    this.#gameState?.setJoinedPlayers(playersData);
    this.#gameState?.addToLog(logMessage);
  }
}
