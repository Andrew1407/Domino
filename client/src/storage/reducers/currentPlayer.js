import { makeReducer } from '../tools/state';
import { CURRENT_PLAYER_SET } from '../types';

const initial = null;

const actions = {
  [CURRENT_PLAYER_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
