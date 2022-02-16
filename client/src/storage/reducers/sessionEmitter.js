import { makeReducer } from '../tools/state';
import { SESSION_EMITTER_SET } from '../types';

const initial = null;

const actions = {
  [SESSION_EMITTER_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
