import { dispatchObj } from '../tools/state';
import { JOINED_PLAYERS_ADD, JOINED_PLAYERS_REMOVE, JOINED_PLAYERS_SET } from '../types';

export const addJoinedPlayer = dispatchObj.bind(null, JOINED_PLAYERS_ADD);
export const removeJoinedPlayer = dispatchObj.bind(null, JOINED_PLAYERS_REMOVE);
export const setJoinedPlayers = dispatchObj.bind(null, JOINED_PLAYERS_SET);
