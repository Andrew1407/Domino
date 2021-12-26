import { makeReducer } from '../tools/state';
import { LOG_ADD } from '../types';

const initial = [];

const actions = {
  [LOG_ADD]: (state, payload) => [ payload, ...state ],
};

export default makeReducer({ initial, actions });
