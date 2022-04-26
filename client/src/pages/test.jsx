import GameSession from '../components/gameSession/GameSession';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setSessionId } from '../storage/actions/sessionId';
import { setJoinedPlayers } from '../storage/actions/joinedPlayers';
import { setPlayerDeck } from '../storage/actions/playerDeck';
import { addToLog } from '../storage/actions/log';
import { setCommonDeck } from '../storage/actions/commonDeck';
import { setFirtsTile } from '../storage/actions/firstTile';

export default function TestPage() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setSessionId('12734182dh7h823r32hf'));
    dispatch(setJoinedPlayers([
      { name: 'Bobo', score: 12, tiles: 2 },
      { name: 'Mavun', score: 12, tiles: 2 },
      { name: 'Sasik', score: 12, tiles: 2, you: true },
      { name: 'Ruzur', score: 12, tiles: 2 },
    ]));
    for (const m of [
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
      'User Sasik joined the session',
      'User Ruzur makes a move with a tile { 3, 2}',
      'User Sasik has won the round with the score 26',
      'The round ended with a draw',
    ]) dispatch(addToLog(m))
    
    dispatch(setPlayerDeck([
      { left: 0, right: 0 },
      { left: 5, right: 0 },
      { left: 3, right: 6 },
      { left: 3, right: 2 },
      { left: 1, right: 4 },
      { left: 1, right: 3 },
      { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
      // { left: 1, right: 1 },
    ]));

    dispatch(setFirtsTile({ left: 0, right: 0 }))

    // dispatch(setCommonDeck([
    //   { left: 1, right: 1 },
    //   { left: 6, right: 5 },
    //   { left: 6, right: 5 },
    //   { left: 5, right: 0 },
    //   { left: 0, right: 0 },
    //   { left: 3, right: 2 },
    //   { left: 1, right: 4 },
    //   { left: 1, right: 4 },
    //   { left: 1, right: 3 },
    // ]));

    dispatch(setCommonDeck([

     
      
      { left: 2, right: 1 },
      { left: 5, right: 0 },
      { left: 0, right: 6 },
      { left: 1, right: 3 },

      { left: 4, right: 4 },

      { left: 6, right: 5 },
      { left: 6, right: 1 },
      
      { left: 6, right: 6 },
      { left: 3, right: 2 },
      { left: 1, right: 4 },
      { left: 5, right: 4 },
      { left: 0, right: 0 },

      
    ]));
    
  }, []);

  return (
    <GameSession />
  );
}
