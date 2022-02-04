import { modalBackground, modalComponent, messageTitle, messageText, modalButton } from '../../styles/modals/ErrorMessageModal.module.scss';

export default function ErrorMessageModal({ visible, message, onClick }) {
  return (
    visible && <div className={modalBackground}>
      <div className={modalComponent}>
        <div>
          <h1 className={messageTitle}>Some error occured</h1>
          <p className={messageText}>{message}</p>
        </div>

        <input
          className={modalButton}
          type="button"
          value="close"
          onClick={onClick}
        />
      </div>
    </div>
  );
};
