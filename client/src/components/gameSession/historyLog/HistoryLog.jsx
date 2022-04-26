import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getLog } from '../../../storage/selectors';
import { logContainer, logMessage } from '../../../styles/gameSession/HistoryLog.module.scss';

export default function HistoryLog() {
  const containerRef = useRef(null);
  const logMessages = useSelector(getLog);

  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [logMessages]);

  return (
    <div ref={containerRef} className={logContainer}>
      {logMessages.map((m, key) => (
        <p key={key} className={logMessage}>{m}</p>
      ))}
    </div>
  )
}
