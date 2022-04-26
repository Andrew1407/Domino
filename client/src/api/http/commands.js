export const loadCommandsList = async () => {
  const response = await fetch(`http://${process.env.SERVER_ADDR}/`);
  if (response.ok) return response.text();
  const { message = 'some error occured' } = await response.json();
  throw new Error(message);
};
