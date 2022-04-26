import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { joinOptionEntries, optionsSubmitBtn } from '../../styles/SessionOptions.module.scss';

export default function SessionSearch() {
  const dispatch = useDispatch();
  const router = useRouter();
  const sessionInupt = useRef();
  const [ sessionId, setSessionId ] = useState('');

  const joinSession = useCallback(async e => {
    e.preventDefault();
    if (!sessionId) return;
    dispatch(setSessionId(sessionId));
    router.push('/game-session/[id]', '/game-session/' + sessionId);
  }, [sessionId]);

  useEffect(() => sessionInupt.current?.focus(), []);

  return (
    <form className={joinOptionEntries} onSubmit={joinSession}>
      <label>Session ID:</label>
      <input
        ref={sessionInupt}
        type="text"
        spellCheck="false"
        onChange={e => setSessionId(e.target.value)}
      />
      <input className={optionsSubmitBtn} type="submit" value="join"/>
    </form>
  );
};