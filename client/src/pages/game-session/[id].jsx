import { useRouter } from 'next/router';
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getJoinedPlayers,
  getRoundInfo,
  getSessionId,
  getSessionEmitter,
} from '../../storage/selectors';
import { setCurrentPlayer } from '../../storage/actions/currentPlayer';
import { setCurrentMove, setRoundInfo } from '../../storage/actions/roundInfo';
import { clearPickedTile } from '../../storage/actions/pickedTile';
import { setPlayerDeck } from '../../storage/actions/playerDeck';
import { setCommonDeck } from '../../storage/actions/commonDeck';
import { setMovePermission } from '../../storage/actions/movePermission';
import { addJoinedPlayer, removeJoinedPlayer, setJoinedPlayers } from '../../storage/actions/joinedPlayers';
import { addToLog } from '../../storage/actions/log';
import { setWaitForPlayers } from '../../storage/actions/waitForPlayers';
import { setSessionId } from '../../storage/actions/sessionId';
import { setFirstTile } from '../../storage/actions/firstTile';
import { setSessionEmitter } from '../../storage/actions/sessionEmitter';
import { socketConnection } from '../../api/ws/socketConnection';
import GameSession from '../../components/gameSession/GameSession';
import ErrorMessageModal from '../../components/modals/ErrorMessageModal';

const makeStateHandlers = dispatch => ({
  setCurrentPlayer: (...args) => dispatch(setCurrentPlayer(...args)),
  setRoundInfo: (...args) => dispatch(setRoundInfo(...args)),
  setJoinedPlayers: (...args) => dispatch(setJoinedPlayers(...args)),
  removeJoinedPlayer: (...args) => dispatch(removeJoinedPlayer(...args)),
  addJoinedPlayer: (...args) => dispatch(addJoinedPlayer(...args)),
  addToLog: (...args) => dispatch(addToLog(...args)),
  setPlayerDeck: (...args) => dispatch(setPlayerDeck(...args)),
  setCommonDeck: (...args) => dispatch(setCommonDeck(...args)),
  setCurrentMove: (...args) => dispatch(setCurrentMove(...args)),
  setMovePermission: (...args) => dispatch(setMovePermission(...args)),
  setFirstTile: (...args) => dispatch(setFirstTile(...args)),
  clearPickedTile: (...args) => dispatch(clearPickedTile(...args)),
});

export default function GameSessionPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const sessionId = useSelector(getSessionId);
  const roundInfo = useSelector(getRoundInfo);
  const sessionEmitter = useSelector(getSessionEmitter);
  const joinedPlayers = useSelector(getJoinedPlayers);
  const [ errorMessage, setErrorMessage ] = useState('');
  const closeModal = useCallback(() => setErrorMessage(''), []);
  
  useEffect(() => {
    if (!sessionId || sessionEmitter) return;
    const handlers = makeStateHandlers(dispatch);
    handlers.setErrorMessage = setErrorMessage;
    
    const emitter = socketConnection(sessionId, handlers);
    dispatch(setSessionEmitter(emitter));

  }, [sessionId]);

  useEffect(() => {
    if (!sessionId && router.query.id)
      dispatch(setSessionId(router.query.id)); 
  }, [router.query.id]);

  useEffect(() => {
    const total = roundInfo.players;
    const joined = joinedPlayers.length;
    if (total && total === joined)
      dispatch(setWaitForPlayers(false));
  }, [roundInfo, joinedPlayers]);

  return (
    <>
      <GameSession />

      <ErrorMessageModal
        visible={!!errorMessage}
        message={errorMessage}
        onClick={closeModal}
      />
    </>
  );
};
