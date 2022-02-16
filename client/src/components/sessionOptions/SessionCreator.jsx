import { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import ErrorMessageModal from '../modals/ErrorMessageModal';
import { createOptionEntries, playersSelector, scoreContainer, optionsSubmitBtn } from '../../styles/SessionOptions.module.scss';
import { createSession } from '../../api/sessionsIdentifier';

const initialScore = 26;
const availablePlayers = [2, 3, 4];

export default function SessionCreator() {
  const dispatch = useDispatch();
  const router = useRouter();
  const sessionInupt = useRef();
  const [ errorMessage, setErrorMessage ] = useState('');
  const [ score, setScore ] = useState(initialScore);
  const [ players, setPlayers ] = useState(availablePlayers[0]);
  
  const closeErrorModal = useCallback(() => setErrorMessage(''), []);

  const setScoreParsed = useCallback(e => {
    const parsed = parseInt(e.target.value, 10);
    setScore(!isNaN(parsed) ? parsed : 0);
  }, []);

  const setPlayersParsed = useCallback(e => {
    const parsed = parseInt(e.currentTarget.value, 10);
    setPlayers(!isNaN(parsed) ? parsed : availablePlayers[0]);
  }, []);

  const createNewSession = useCallback(async e => {
    e.preventDefault();
    try {
      const createdSession = await createSession(players, score);
      dispatch(setSessionId(createdSession));
      router.push('/game-session/[id]', '/game-session/' + createdSession);
    } catch (e) {
      setErrorMessage(e.message);
    }
  }, [score, players]);

  useEffect(() => sessionInupt.current?.focus(), []);

  return (
    <form className={createOptionEntries} onSubmit={createNewSession}>
      <div className={playersSelector}>
        <label>Players:</label>
        <select value={players} onChange={setPlayersParsed}>
          {availablePlayers.map(p => (
            <option key={p} value={p} onClick={() => setPlayers(p)}>{p}</option>
          ))}
        </select>
      </div>

      <div className={scoreContainer}>
        <label>Finish score:</label>
        <input
          ref={sessionInupt}
          type="number"
          value={score}
          onChange={setScoreParsed}
        />
      </div>

      <input className={optionsSubmitBtn} type="submit" value="create" />

      <ErrorMessageModal
        visible={!!errorMessage}
        message={errorMessage}
        onClick={closeErrorModal}
      />
    </form>
  );
};
