import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { addJoinedPlayer, removeJoinedPlayer, setJoinedPlayers } from '../../storage/actions/joinedPlayers';
import { addToLog } from '../../storage/actions/log';
import { socketConnection } from '../../api/socketConnection';

export default function GameSessionPage() {
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
    const handlers = {
      setErrorMessage: (...args) => alert(...args),
      setCurrentPlayer: (...args) => dispatch(setCurrentPlayer(...args)),
      setRoundInfo: (...args) => dispatch(setRoundInfo(...args)),
      setJoinedPlayers: (...args) => dispatch(setJoinedPlayers(...args)),
      removeJoinedPlayer: (...args) => dispatch(removeJoinedPlayer(...args)),
      addJoinedPlayer: (...args) => dispatch(addJoinedPlayer(...args)),
      addToLog: (...args) => dispatch(addToLog(...args)),
      setPlayerDeck: (...args) => dispatch(setPlayerDeck(...args)),
      setCommonDeck: (...args) => dispatch(setCommonDeck(...args)),
      setCurrentMove: (...args) => dispatch(setCurrentMove(...args)),
    };

    const sessionEmitter = socketConnection(sessionId, handlers);
    setSessionSocket(sessionEmitter);
  }, []);

  const pickTile = tile => () => dispatch(setPickedTile(tile));
  const placeTile = side => () => {
    if (roundInfo.currentMove !== currentPlayer) return;
    sessionSocket.moveAction(side, pickedTile);
    dispatch(clearPickedTile());
  };

  const fromStock = () => {
    if (roundInfo.currentMove !== currentPlayer) return;
    sessionSocket.takeFromStock();
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

GameSessionPage.getInitialProps = async (ctx) => {
  const { session } = ctx.query;
  return { props: { session } };
}
