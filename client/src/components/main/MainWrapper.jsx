import Footer from './Footer';
import Header from './Header';
import { centralBlock, mainBlock } from '../../styles/main/MainWrapper.module.scss';

export default function MainWrapper({ HeaderInfo, children }) {
  return (
    <div className={mainBlock}>
      {HeaderInfo ? 
        <Header>
          <HeaderInfo />
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
