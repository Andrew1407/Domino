import { dispatchObj } from '../tools/state';
import { CURRENT_PLAYER_SET } from '../types';

export const setCurrentPlayer = dispatchObj.bind(null, CURRENT_PLAYER_SET);
