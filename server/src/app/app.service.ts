import { Injectable } from '@nestjs/common';
import commands from './commands.json';

@Injectable()
export default class AppService {
  public async getCommands(): Promise<string> {
    return JSON.stringify(commands);
  }
}
