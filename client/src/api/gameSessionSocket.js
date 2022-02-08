
export const connectToSession = (id, events) => {
  const socket = new WebSocket(`ws://${process.env.WS_ADDR}/domino-session`);
  socket.onopen = () => {
    sendFrom(socket, 'joinSession', { session: id });
  }

  socket.onerror = err => {
    console.error(err);
    alert(err);
  };

  socket.onmessage = e => {
    const entries = JSON.parse(e.data);
    const { event, errorStatus, data } = entries;
    events[event]?.(data, errorStatus);
  };
  
  return socket;
};

export const sendFrom = (socket, event, data) => {
  socket?.send(JSON.stringify({ event, data }));
};
