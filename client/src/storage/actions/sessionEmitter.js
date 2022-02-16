import { dispatchObj } from '../tools/state';
import { SESSION_EMITTER_SET } from '../types';

export const setSessionEmitter = dispatchObj.bind(null, SESSION_EMITTER_SET);
