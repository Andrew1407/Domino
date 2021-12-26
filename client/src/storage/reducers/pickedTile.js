import { makeReducer } from '../tools/state';
import { PICKED_TILE_SET } from '../types';

const initial = null;

const actions = {
  [PICKED_TILE_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
