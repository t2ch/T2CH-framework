import WebSocket from 'ws';

export default class Wss extends WebSocket.Server {
  constructor(port) {
    super({ port, clientTracking: true });
  }

  async write(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
      // console.log(`write: ${JSON.stringify(message)}`);
      socket.send(JSON.stringify(message));
    }
  }

  async broadcast(message) {
    // console.log('broadcast');
    this.clients.forEach(client => {
      this.write(client, message);
    });
  }
}
