import { makeReducer } from '../tools/state';
import { JOINED_PLAYERS_ADD, JOINED_PLAYERS_SET, JOINED_PLAYERS_REMOVE } from '../types';

const initial = [];

const actions = {
  [JOINED_PLAYERS_ADD]: (state, payload) => [
    ...state, { name: payload, score: 0, tiles: 0 }
  ],
  [JOINED_PLAYERS_REMOVE]: (state, payload) => state.filter(
    player => player.name !== payload
  ),
  [JOINED_PLAYERS_SET]: (_, payload) => payload,
};

export default makeReducer({ initial, actions });
