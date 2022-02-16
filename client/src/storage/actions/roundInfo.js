import { dispatchObj } from '../tools/state';
import { ROUND_INFO_SET, ROUND_INFO_SET_NEXT_MOVE } from '../types';

export const setRoundInfo = dispatchObj.bind(null, ROUND_INFO_SET);
export const setCurrentMove = dispatchObj.bind(null, ROUND_INFO_SET_NEXT_MOVE);
