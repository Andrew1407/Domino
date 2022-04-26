import { makeReducer } from '../tools/state';
import { FIRST_TILE_SET } from '../types';

const initial = null;

const actions = {
  [FIRST_TILE_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
