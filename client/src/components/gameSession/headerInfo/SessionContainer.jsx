import { useCallback } from 'react';
import Image from 'next/image';
import { sessionComponent } from '../../../styles/gameSession/HeaderInfo.module.scss';

export default function SessionContainer({ id }) {
  const copyToClipboard = useCallback(() => (
    navigator.clipboard?.writeText(id)
  ), [id]);

  return (
    <div onClick={copyToClipboard} className={sessionComponent}>
      <p>Session ID: </p>
      <Image src="/static/clipboard.png" width={30} height={30} />
    </div>
  );
}

