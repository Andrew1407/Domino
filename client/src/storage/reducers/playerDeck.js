import { makeReducer } from '../tools/state';
import { PLAYER_DECK_SET } from '../types';

const initial = [];

const actions = {
  [PLAYER_DECK_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
