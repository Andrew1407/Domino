import { useRouter } from 'next/router';

export default function GameSession() {
  const router = useRouter();

  return (
    <div>
      <p>{router.query.id}</p>
    </div>
  );
};
