import { makeReducer } from '../tools/state';
import { MOVE_PERMISSION_SET } from '../types';

const initial = null;

const actions = {
  [MOVE_PERMISSION_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
