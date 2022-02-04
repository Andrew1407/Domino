import MainWrapper from '../components/main/MainWrapper';
import CommandsList from '../components/commands/CommandsList';

export default function HelloPage({ commands }) {
  return (
    <MainWrapper>
      <CommandsList entries={commands} />
    </MainWrapper>
  );
};

export async function getServerSideProps() {
  const response = await fetch(`http://${process.env.SERVER_ADDR}/`);
  const params = { props: null };
  if (response.ok) params.props = { commands: await response.text() };
  return params;
};
