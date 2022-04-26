import { useState, useEffect } from 'react';
import { getTileImagePath } from '../../../tools';
import { loadingScreen, laodingTitle, tilesLoadContaner, loadingTile } from '../../../styles/gameSession/DominoBoard.module.scss';

export default function ConnectionLoading() {
  const [ loadingTiles, setLoadingTiles ] = useState([]);

  useEffect(() => {
    const loadTile = async () => {
      const currentCount = loadingTiles.length;
      const maxTilesCount = 7;
      const loadingDelay = 400;
      await new Promise(res => setTimeout(res, loadingDelay));   
      if (currentCount === maxTilesCount) {
        setLoadingTiles([]);
        return;
      }
      if (!currentCount) {
        const tile = { left: 0, right: 0 };
        setLoadingTiles([ ...loadingTiles, tile ]);
        return;
      }
      const lastTile = loadingTiles[currentCount - 1];
      const nextValue = lastTile.left + 1;
      const tile = { left: nextValue, right: nextValue };
      setLoadingTiles([ ...loadingTiles, tile ]);
    };

    loadTile();
  }, [loadingTiles]);

  return (
    <div className={loadingScreen}>
      <h1 className={laodingTitle}>Waiting for players...</h1>

      <div className={tilesLoadContaner}>
        {loadingTiles.map(t => (
          <img key={t.right} className={loadingTile} src={getTileImagePath(t)} />
        ))}
      </div>
    </div>
  );
};
