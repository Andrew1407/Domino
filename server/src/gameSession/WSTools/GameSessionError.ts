import ErrorStatus from './ErrorStatus';
import ReqWS from './responseTypes';

export default class GameSessionError extends Error {
  public static notExists(): GameSessionError {
    return new GameSessionError(
      'Current session does not exist',
      ErrorStatus.SESSION_NOT_EXISTS
    );
  }

  public static forbidden(): GameSessionError {
    return new GameSessionError(
      'Current game session is forbidden to you',
      ErrorStatus.SESSION_FORBIDDEN
    );
  }

  public static unavailableMove(): GameSessionError {
    return new GameSessionError(
      'You are not supposed to make move right now',
      ErrorStatus.MOVE_UNAVAILABLE
    );
  }

  public static playersLimit(): GameSessionError {
    return new GameSessionError(
      'Players limit has already been reached',
      ErrorStatus.PLAYERS_LIMIT_REACHED
    );
  }

  public static internal(): GameSessionError {
    return new GameSessionError(
      'Internal server error',
      ErrorStatus.INTERNAL_SERVER_ERROR
    );
  }

  public static badRequest(): GameSessionError {
    return new GameSessionError(
      'Invalid session data has been sent',
      ErrorStatus.BAD_REQUEST
    );
  }

  public static catchHandler(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const original: any = descriptor.value;
    descriptor.value = async function(
      client: WebSocket, ...args: unknown[]
    ): Promise<any> {
      try {
        await original.call(this, client, ...args);
      } catch(e) {
        const caught: GameSessionError = e instanceof GameSessionError ?
          e : GameSessionError.internal();
        client.send(JSON.stringify(caught.info()));
      }
    } 
    return descriptor;
  }

  constructor(
    message: string,
    private readonly status: ErrorStatus
  ) {
    super(message);
  }

  public info(): ReqWS<string> {
    return { status: this.status, data: this.message };
  }
}
