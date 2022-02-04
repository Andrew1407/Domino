import { useEffect, useRef } from 'react';
import { createOptionEntries, playersSelector, scoreContainer, createButton, optionsSubmitBtn } from '../../styles/SessionOptions.module.scss';

const availablePlayers = [2, 3, 4];

export default function SessionCreator() {
  const sessionInupt = useRef();

  useEffect(() => sessionInupt.current?.focus(), []);


  return (
    <form className={createOptionEntries}>
      <div className={playersSelector}>
        <label>Players:</label>
        <select>
          {availablePlayers.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className={scoreContainer}>
        <label>Finish score:</label>
        <input ref={sessionInupt} type="number" />
      </div>

      <input className={optionsSubmitBtn} type="submit" value="create" />
    </form>
  );
};
