import ErrorStatus from './ErrorStatus';
import GameSessionRes from './responseTypes';

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

  public static emptyStock(): GameSessionError {
    return new GameSessionError(
      'You cannot get tiles from the empty stock',
      ErrorStatus.EMPTY_STOCK
    );
  }

  public static catchHandler(): (...args: unknown[]) => PropertyDescriptor {
    return function(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ): PropertyDescriptor {
      const original: Function = descriptor.value;
      descriptor.value = async function(...args: unknown[]): Promise<unknown> {
        try {
          const resArgs: unknown = await original.apply(this, args);
          return resArgs;
        } catch(e) {
          if (e instanceof GameSessionError) return e.info();
          return GameSessionError.internal().info();
        }
      };

      return descriptor;
    };
  }
      
      constructor(message: string, private readonly status: ErrorStatus) {
        super(message);
  }

  public info(): GameSessionRes<string> {
    return {
      event: 'error',
      errorStatus: this.status,
      data: this.message,
    };
  }
}
