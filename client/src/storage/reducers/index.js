import { combineReducers } from 'redux';
import joinedPlayers from './joinedPlayers';
import log from './log';
import pickedTile from './pickedTile';
import playerDeck from './playerDeck';
import commonDeck from './commonDeck';
import roundInfo from './roundInfo';
import currentPlayer from './currentPlayer';
import sessionEmitter from './sessionEmitter';
import sessionId from './sessionId';
import waitForPlayers from './waitForPlayers';

const combined = {
  joinedPlayers,
  log,
  currentPlayer,
  pickedTile,
  playerDeck,
  commonDeck,
  roundInfo,
  sessionEmitter,
  sessionId,
  waitForPlayers,
};

const rootReducer = combineReducers(combined);

export default rootReducer;
