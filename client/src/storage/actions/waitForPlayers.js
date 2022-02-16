import { dispatchObj } from '../tools/state';
import { WAIT_FOR_PLAYERS_SET } from '../types';

export const setWaitForPlayers = dispatchObj.bind(null, WAIT_FOR_PLAYERS_SET);
