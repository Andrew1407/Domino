import { dispatchObj } from '../tools/state';
import { FIRST_TILE_SET } from '../types';

export const setFirstTile = dispatchObj.bind(null, FIRST_TILE_SET);
