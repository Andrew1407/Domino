export default class SessionEmitter {
  #socket = null;
  #sessionId = undefined;

  constructor(socket, sessionId) {
    this.#socket = socket;
    this.#sessionId = sessionId;
  }

  joinSession() {
    this.#sendData({
      event: 'joinSession',
      data: { session: this.#sessionId },
    });
  }

  takeFromStock() {
    this.#sendData({
      event: 'fromStock',
      data: { session: this.#sessionId },
    });
  }

  checkMoveAction(side, tile) {
    this.#sendData({
      event: 'moveCheck',
      data: { side, tile, session: this.#sessionId },
    });
  }

  moveAction(side, tile) {
    this.#sendData({
      event: 'moveAction',
      data: { side, tile, session: this.#sessionId },
    });
  }

  #sendData(data) {
    this.#socket?.send(JSON.stringify(data));
  }
}
