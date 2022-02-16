import { dispatchObj } from '../tools/state';
import { SESSION_ID_SET } from '../types';

export const setSessionId = dispatchObj.bind(null, SESSION_ID_SET);
