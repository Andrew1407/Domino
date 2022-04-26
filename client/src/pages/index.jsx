import MainWrapper from '../components/main/MainWrapper';
import CommandsList from '../components/commands/CommandsList';
import { loadCommandsList } from '../api/http/commands';

export default function HelloPage({ commands }) {
  return (
    <MainWrapper>
      <CommandsList entries={commands} />
    </MainWrapper>
  );
};

export async function getServerSideProps() {
  const params = { props: null };
  try {
    const commands = await loadCommandsList();
    params.props = { commands };
  } finally {
    return params;
  }
};
