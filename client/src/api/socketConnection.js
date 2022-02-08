import SessionEmitter from './sessionEmitter';
import SessionListener from './sessionListener';

export const socketConnection = (sessionId, stateHandlers) => {
  const socket = new WebSocket(`ws://${process.env.WS_ADDR}/domino-session`);
  const listener = new SessionListener(stateHandlers);
  const emitter = new SessionEmitter(socket, sessionId);

  socket.onopen = () => {
    emitter.joinSession();
  };

  socket.onerror = () => {
    const errorMessage = 'Internal WebSocket error occured';
    stateHandlers.setErrorMessage(errorMessage);
  };

  socket.onmessage = e => {
    const entries = JSON.parse(e.data);
    const { event, errorStatus, data } = entries;
    listener[event]?.(data, errorStatus);
  };

  return emitter;
};
