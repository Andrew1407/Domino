import { useCallback, useState } from 'react';
import MainWrapper from '../../components/main/MainWrapper';
import ErrorMessageModal from '../../components/modals/ErrorMessageModal';
import SessionOptions from '../../components/sessionOptions/SessionOptions';

export default function SessionMenu() {
  const [ errorMessage, setErrorMessage ] = useState('');
  const closeModal = useCallback(() => setErrorMessage(''), []);

  return (
    <>
      <MainWrapper>
        <SessionOptions />
      </MainWrapper>

      <ErrorMessageModal
        visible={!!errorMessage}
        message={errorMessage}
        onClick={closeModal}
      />
    </>
  );
}
