import { useState } from 'react';
import { useRouter } from 'next/router';
import { createSession } from '../../api/sessionsIdentifier';

export default function SessionCreator() {
  const router = useRouter();
  const [ sessionParams, setSessionParams ] = useState({
    players: 0,
    score: 0,
  });

  const changeSessionParam = e => {
    const { name, value } = e.target;
    setSessionParams({ ...sessionParams, [name]: value });
  };

  const createNewSession = async () => {
    const { score, players } = sessionParams;
    try {
      const sessionId = await createSession(players, score);
      router.push('/demo/[session]', '/demo/' + sessionId);
    } catch (e) {
      alert('Invalid params ' + e.message);
    }
  };

  return (
    <div>
      <input onChange={changeSessionParam} type="number" name="players" placeholder="players: 2-4"/>
      <input onChange={changeSessionParam} type="number" name="score" placeholder="final score"/>
      <input onClick={createNewSession} type="button" value="create session"/>
    </div>
  );
}
