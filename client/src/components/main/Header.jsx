import { header, title } from '../../styles/main/Header.module.scss';

export default function Header({ children }) {
  return (
    <header className={header}>
      <div className={title}>
        <h1>Domino</h1>
      </div>

      {children}
    </header>
  );
};
