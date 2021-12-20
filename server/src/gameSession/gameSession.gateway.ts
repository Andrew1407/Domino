import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import StorageService from 'src/gameSession/storage/storage.service';

dotenv.config();

const WS_PORT: number = parseInt(process.env.WS_PORT, 10) || 8081;
const WS_ROUTE: string = process.env.WS_ROUTE || '/domino-session';

@WebSocketGateway(WS_PORT, { path: WS_ROUTE })
export default class GameSessionGateway {
  @WebSocketServer() private readonly wss: Server;
  private sss: { [key: string]: WebSocket[] } = {};

  constructor(private readonly db: StorageService) {}

  @SubscribeMessage('test-data')
  public async onTestData(@ConnectedSocket() client: WebSocket, @MessageBody() data: string) {
    this.sss[data] ??= [];
    this.sss[data].push(client);
    return data.length;
  }

  public sendMessage(message: string) {
    this.sss[message]?.forEach(c => c.send(message));
  }
}
