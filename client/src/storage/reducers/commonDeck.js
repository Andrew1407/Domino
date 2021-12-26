import { makeReducer } from '../tools/state';
import { COMMON_DECK_SET } from '../types';

const initial = [];

const actions = {
  [COMMON_DECK_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
