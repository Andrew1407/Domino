export const createSession = async (players, score) => {
  const response = await fetch(`http://${process.env.SERVER_ADDR}/domino-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ players, score }),
  });
  if (response.ok) return response.text();
  const { message = 'some error occured' } = await response.json();
  throw new Error(message);
};
