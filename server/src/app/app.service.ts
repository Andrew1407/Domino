import { Injectable } from '@nestjs/common';

@Injectable()
export default class AppService {
  public getTitle(): string {
    return 'Domino game menu (work in progress)';
  }
}
