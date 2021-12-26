export const createSession = async (players, score) => {
  const response = await fetch(
  `http://${process.env.SERVER_ADDR}/domino-session`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ players, score }),
  });
  if (!response.ok) return null;
  return response.text();
};
