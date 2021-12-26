import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectToSession, sendFrom } from '../../api/gameSessionSocket';
import {
  panelsContainer,
  playersInfo,
  tilesDecks,
  journal
} from '../../styles/GameSession.module.scss';
import {
  getCurentPlayer,
  getJoinedPlayers,
  getLog,
  getCommonDeck,
  getPickedTile,
  getPlayerDeck,
  getRoundInfo
} from '../../storage/selectors';
import { setCurrentPlayer } from '../../storage/actions/currentPlayer';
import { setCurrentMove, setRoundInfo } from '../../storage/actions/roundInfo';
import { setPickedTile, clearPickedTile } from '../../storage/actions/pickedTile';
import { setPlayerDeck } from '../../storage/actions/playerDeck';
import { setCommonDeck } from '../../storage/actions/commonDeck';
import { addJoinedPlayer, removeJoinedPlayer, setJoinedPlayers, setJoinedPlayersInitial } from '../../storage/actions/joinedPlayers';
import { addToLog } from '../../storage/actions/log';

export default function GameSession() {
  const router = useRouter();
  const sessionId = router.query.session;
  const dispatch = useDispatch();
  const [ sessionSocket, setSessionSocket ] = useState(null);
  const currentPlayer = useSelector(getCurentPlayer);
  const joinedPlayers = useSelector(getJoinedPlayers);
  const log = useSelector(getLog);
  const pickedTile = useSelector(getPickedTile);
  const playerDeck = useSelector(getPlayerDeck);
  const commonDeck = useSelector(getCommonDeck);
  const roundInfo = useSelector(getRoundInfo);

  useEffect(() => {
    const socket = connectToSession(sessionId, {
      error(data, status) {
        console.error({ status, data });
        alert(JSON.stringify({ status, data }));
      },

      joinSession({ name, players, score, scores, round }) {
        console.log(players);
        dispatch(setCurrentPlayer(name));
        dispatch(setRoundInfo({
          players,
          finalScore: score,
          currentRound: round,
          stock: 0,
        }));
        dispatch(setJoinedPlayersInitial(Object.keys(scores)));
      },

      leaveSession({ name }) {
        console.log('Left: ', name);
        dispatch(removeJoinedPlayer(name));
        dispatch(addToLog(`Player "${name}" has left the current session.`));        
      },

      sessionNewcomer({ name }) {
        console.log('Joined: ', name);
        dispatch(addJoinedPlayer(name));
        dispatch(addToLog(`Player "${name}" has joined the current session.`));
      },

      interruptedSession({ name }) {
        console.log(name, 'interrupted the session game');
        alert(name + ' interrupted the session game');
      },

      moveAction({ deck, commonDeck, players, score, scores, tilesCount, current_move, round, stock, tile }) {
        console.log(current_move, 'made a move');
        if (deck) dispatch(setPlayerDeck(deck));
        dispatch(setCommonDeck(commonDeck));
        dispatch(setRoundInfo({
          stock,
          players,
          finalScore: score,
          currentRound: round,
          currentMove: current_move,
        }));
        const playersData = Object.keys(tilesCount).map(p => ({
          name: p, score: scores[p], tiles: tilesCount[p]
        }));
        dispatch(setJoinedPlayers(playersData));
        dispatch(addToLog(`Player "${current_move}" made a move with a tile ${JSON.stringify(tile)}.`));
      },

      fromStock({ deck, commonDeck, players, score, scores, tilesCount, current_move, round, stock, tile }) {
        console.log(current_move, 'took a tile from the stock');
        if (deck) dispatch(setPlayerDeck(deck));
        if (tile) console.log(tile);
        dispatch(setCommonDeck(commonDeck));
        dispatch(setRoundInfo({
          stock,
          players,
          finalScore: score,
          currentRound: round,
          currentMove: current_move,
        }));
        const playersData = Object.keys(tilesCount).map(p => ({
          name: p, score: scores[p], tiles: tilesCount[p]
        }));
        dispatch(setJoinedPlayers(playersData));
        dispatch(addToLog(`Player "${current_move}" took a tile from the stock.`));
      },

      endRound({ scores, winner, endGame }) {
        if (!winner) {
          console.log('Draw!');
          dispatch(addToLog('The round ended with a draw.'));
        }
        else {
          console.log('Round winner:', winner);
          dispatch(addToLog(`Player ${winner} won the round with the score ${scores[winner]}.`));
        }
        if (endGame) {
          console.log('Game winner:', winner);
          dispatch(addToLog(`Player ${winner} won the game with the score ${scores[winner]}.`));
        };
        console.log(scores);
      },

      roundStart({ deck, name, players, round, score, scores, stock, tilesCount }) {
        console.log('Start of a round', round);
        dispatch(setPlayerDeck(deck));
        dispatch(setRoundInfo({
          stock,
          players,
          finalScore: score,
          currentRound: round,
        }));
        const playersData = Object.keys(tilesCount).map(p => ({
          name: p, score: scores[p], tiles: tilesCount[p]
        }));
        dispatch(setJoinedPlayers(playersData));
        dispatch(addToLog(`Round ${round} has started.`));
      },

      firstMove({ deck, commonDeck, players, score, scores, tilesCount, current_move, round, stock, tile }) {
        console.log(current_move, 'made a first move');
        if (deck) dispatch(setPlayerDeck(deck));
        dispatch(setCommonDeck(commonDeck));
        dispatch(setRoundInfo({
          stock,
          players,
          finalScore: score,
          currentRound: round,
          currentMove: current_move,
        }));
        const playersData = Object.keys(tilesCount).map(p => ({
          name: p, score: scores[p], tiles: tilesCount[p]
        }));
        dispatch(setJoinedPlayers(playersData));
        dispatch(addToLog(`Player "${current_move}" made a first move with a tile ${JSON.stringify(tile)}.`));
      },

      nextMove({ name, skippedBy }) {
        console.log(name + '\'s turn to make a move');
        if (skippedBy) {
          console.log(skippedBy, 'skips a move');
          dispatch(addToLog(`Player "${skippedBy}" is unable to make a move and skips it.`));
        }
        dispatch(setCurrentMove(name));
        dispatch(addToLog(`The next move is for player "${name}"`));
      },
    });

    setSessionSocket(socket);
    return () => socket.close();
  }, []);

  const pickTile = tile => () => dispatch(setPickedTile(tile));
  const placeTile = side => () => {
    if (roundInfo.currentMove !== currentPlayer) return;
    sendFrom(
      sessionSocket,
      'moveAction',
      { side, session: sessionId, tile: pickedTile }
    )
    dispatch(clearPickedTile());
  };

  const fromStock = () => {
    if (roundInfo.currentMove !== currentPlayer) return;
    sendFrom(
      sessionSocket,
      'fromStock',
      { session: sessionId }
    )
  };

  return (
    <>
      <Head>
        <title>{currentPlayer}</title>
      </Head>

      <div className={panelsContainer}>
        <div className={playersInfo}>
          <p>Players: {roundInfo.players}</p>
          <p>Current move: {roundInfo.currentMove ?? 'None'}</p>
          <p>Final score: {roundInfo.finalScore}</p>
          <p>Current round: {roundInfo.currentRound}</p>
        </div>

        <div className={playersInfo}>
          <p>Picked: {pickedTile ? JSON.stringify(pickedTile) : 'None'}</p>
          <input onClick={placeTile('left')} type="button" value="place up"/>
          <input onClick={placeTile('right')} type="button" value="place down"/>
          <input onClick={fromStock} type="button" value={`take from stock (${roundInfo.stock})`}/>
        </div>

        <div className={playersInfo}>
          {joinedPlayers.map(p => 
            <p key={JSON.stringify(p)}>
              {p.name}<b>
                {p.name === currentPlayer && ' (you)'}
              </b>: {p.tiles} | {p.score}
            </p>
          )}
        </div>

        <div className={tilesDecks}>
          <div>
            <p>Your deck</p>
            <div>
              {playerDeck.map(t => 
                <p onClick={pickTile(t)} key={JSON.stringify(t)}>{JSON.stringify(t)}</p>  
              )}
            </div>
          </div>

          <div>
            <p>Common deck</p>
            <div>
              {commonDeck.map(t => 
                <p key={JSON.stringify(t)}>{JSON.stringify(t)}</p>  
              )}
            </div>
          </div>
        </div>

        <div className={journal}>
          {log.map((l, i) => 
            <p key={i}>{l}</p>  
          )}
        </div>
      </div>
    </>
  );
};

GameSession.getInitialProps = async (ctx) => {
  const { session } = ctx.query;
  return { props: { session } };
}
