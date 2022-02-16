import { makeReducer } from '../tools/state';
import { WAIT_FOR_PLAYERS_SET } from '../types';

const initial = true;

const actions = {
  [WAIT_FOR_PLAYERS_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
