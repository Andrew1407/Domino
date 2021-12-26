import { dispatchObj } from '../tools/state';
import { PLAYER_DECK_SET } from '../types';

export const setPlayerDeck = dispatchObj.bind(null, PLAYER_DECK_SET);
