import { Provider } from 'react-redux';
import { createWrapper } from 'next-redux-wrapper';
import storage from '../storage';
import '../styles/styles.scss';

const App = ({ Component, pageProps }) => (
  <Provider store={storage}>
    <Component { ...pageProps } />
  </Provider>
);

const storageWrapper = createWrapper(() => storage);

export default storageWrapper.withRedux(App);
