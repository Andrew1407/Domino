import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

const WS_PORT: number = parseInt(process.env.WS_PORT, 10) || 8081;
const WS_ROUTE: string = process.env.WS_ROUTE || '/domino-session';

@WebSocketGateway(WS_PORT, { path: WS_ROUTE })
export default class GameSessionGateway {
  @WebSocketServer() private readonly wss: Server;

  @SubscribeMessage('test-data')
  public async onTestData(@MessageBody() data: string) {
    return data.length;
  }
}
