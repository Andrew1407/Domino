import { makeReducer } from '../tools/state';
import { ROUND_INFO_SET, ROUND_INFO_SET_NEXT_MOVE } from '../types';

const initial = {
  currentMove: null,
  finalScore: 0,
  currentRound: 0,
  players: 0,
  stock: 0,
};

const actions = {
  [ROUND_INFO_SET]: (state, payload) => ({ ...state, ...payload }),
  [ROUND_INFO_SET_NEXT_MOVE]: (state, payload) => ({ ...state, currentMove: payload }),
};

export default makeReducer({ initial, actions });
