import Footer from './Footer';
import Header from './Header';
import { centralBlock, mainBlock } from '../../styles/main/MainWrapper.module.scss';

export default function MainWrapper({ headerEntries, children }) {
  return (
    <div className={mainBlock}>
      {headerEntries ? 
        <Header>
          <headerEntries />
        </Header> :
        <Header />
      }

      <div className={centralBlock}>
        {children}
      </div>

      <Footer />
    </div>
  );
};
