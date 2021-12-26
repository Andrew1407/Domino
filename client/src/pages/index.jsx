export default function HelloPage({ commands: commandsRaw }) {
  if (!commandsRaw)
    return (<div><p>No commands fetched</p></div>);
  const commands = JSON.parse(commandsRaw);

  return (
    <div>
      <div>
        <h2>HTTP requests:</h2>
        {Object.entries(commands['HTTP requests']).map(([k, v]) => (
          <p key={k}><b>{k}:</b> {v}</p>
        ))}
      </div>
      <div>
        <h2>WebSocket commands:</h2>
        <h3>server events:</h3>
        {Object.entries(commands['WebSocket commands']['server events'])
          .map(([k, v]) => (<p key={k}><b>{k}:</b> {v}</p>))
        }
        <h3>client events:</h3>
        {Object.entries(commands['WebSocket commands']['client events'])
          .map(([k, v]) => (<p key={k}><b>{k}:</b> {v}</p>))
        }
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const response = await fetch(`http://${process.env.SERVER_ADDR}/`);
  if (!response.ok) return { props: null };
  return {
    props: { commands: await response.text() },
  }
}
