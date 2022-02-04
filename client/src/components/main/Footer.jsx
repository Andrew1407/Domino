import { footer, refText, title, version } from '../../styles/main/Footer.module.scss';

export default function Footer() {
  return (
    <footer className={footer}>
      <p className={version}>
        <small>
          <b>version: 0.1.0</b>
        </small>
      </p>

      <p className={title}>
        <b>DichES</b>
      </p>

      <p>
        <b>
          <small>
            <a className={refText} href="https://github.com/Andrew1407/Domino" target="_blank">git repo</a>
          </small>
        </b>
      </p>
    </footer>
  );
};
