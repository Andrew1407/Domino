import { dispatchObj } from '../tools/state';
import { COMMON_DECK_SET } from '../types';

export const setCommonDeck = dispatchObj.bind(null, COMMON_DECK_SET);
