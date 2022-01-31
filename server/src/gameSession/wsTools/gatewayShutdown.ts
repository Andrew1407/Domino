import GameSessionError from './GameSessionError';

export default function gatewayShutdown(err: Error): void | never {
  const gameSessionInstance: boolean = err instanceof GameSessionError;
  if (gameSessionInstance) process.exit(1);
}
