import { combineReducers } from 'redux';
import joinedPlayers from './joinedPlayers';
import log from './log';
import pickedTile from './pickedTile';
import playerDeck from './playerDeck';
import commonDeck from './commonDeck';
import roundInfo from './roundInfo';
import currentPlayer from './currentPlayer';

const combined = {
  joinedPlayers,
  log,
  currentPlayer,
  pickedTile,
  playerDeck,
  commonDeck,
  roundInfo,
};

const rootReducer = combineReducers(combined);

export default rootReducer;
