import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import PlayerInfo from '../PlayerInfo';

describe('PlayerInfo', () => {
  it('renders score', () => {
    const testData = {
      name: 'Mavun',
      score: 26,
      tiles: 5,
      you: false,
    };
    const { getByTestId } = render(< PlayerInfo {...testData} />);
    const playerInfo = getByTestId('player-info');
    expect(playerInfo).toHaveTextContent(testData.score);
  });
});
