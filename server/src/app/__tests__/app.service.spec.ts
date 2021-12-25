import AppService from '../app.service';
import commands from '../commands.json';

describe('getCommands', (): void => {
  const service: AppService = new AppService();
  it('sould resolve commands in JSON format', async (): Promise<void> => {
    const expected: string = JSON.stringify(commands);
    await expect(service.getCommands()).resolves
      .toEqual(expected);
  });
});
