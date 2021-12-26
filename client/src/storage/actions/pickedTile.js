import { dispatchObj } from '../tools/state';
import { PICKED_TILE_SET } from '../types';

export const setPickedTile = dispatchObj.bind(null, PICKED_TILE_SET);
export const clearPickedTile = setPickedTile.bind(null, null);
