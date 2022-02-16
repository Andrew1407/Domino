import { makeReducer } from '../tools/state';
import { SESSION_ID_SET } from '../types';

const initial = null;

const actions = {
  [SESSION_ID_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
