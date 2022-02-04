import { useState } from 'react';
import SessionCreator from './SessionCreator';
import SessionSearch from './SessionSearch';
import { optionsContainer, optionsList, optionBlock, pickedOptionBlock } from '../../styles/SessionOptions.module.scss';

const options = {
  'create session': SessionCreator,
  'join session': SessionSearch,
};

export default function SessionOptions() {
  const [pickedOption, setPickedOption] = useState('create session');
  const VisibleOption = options[pickedOption];

  return (
    <div className={optionsContainer}>
      <div className={optionsList}>
        {Object.keys(options).map(op => (
          <div
            key={op}
            className={op === pickedOption ? `${optionBlock} ${pickedOptionBlock}` : optionBlock}
            onClick={() => setPickedOption(op)}
          >
            <p>{op}</p>
          </div>
        ))}
      </div>

      <VisibleOption />
    </div>
  );
};
