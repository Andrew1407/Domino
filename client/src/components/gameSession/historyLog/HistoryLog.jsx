import { useSelector } from 'react-redux';
import { getLog } from '../../../storage/selectors';
import { logContainer, logMessage } from '../../../styles/gameSession/HistoryLog.module.scss';

export default function HistoryLog() {
  const logMessages = useSelector(getLog);

  return (
    <div className={logContainer}>
      {logMessages.map((m, key) => (
        <p key={key} className={logMessage}>{m}</p>
      ))}
    </div>
  )
}
