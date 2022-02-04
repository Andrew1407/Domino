import { useEffect, useRef } from 'react';
import { joinOptionEntries, optionsSubmitBtn } from '../../styles/SessionOptions.module.scss';

export default function SessionSearch() {
  const sessionInupt = useRef();

  useEffect(() => sessionInupt.current?.focus(), []);

  return (
    <form className={joinOptionEntries}>
      <label>Session ID:</label>
      <input ref={sessionInupt} type="text" spellCheck="false"/>
      <input className={optionsSubmitBtn} type="submit" value="join" />
    </form>
  );
};
