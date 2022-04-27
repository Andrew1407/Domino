import { dispatchObj } from '../tools/state';
import { MOVE_PERMISSION_SET } from '../types';

export const setMovePermission = dispatchObj.bind(null, MOVE_PERMISSION_SET);
export const clearMovePermission = setMovePermission.bind(null, null);
