import { dispatchObj } from '../tools/state';
import { LOG_ADD } from '../types';

export const addToLog = dispatchObj.bind(null, LOG_ADD);
