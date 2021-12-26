export const dispatchObj = (type, payload) => ({ type, payload });

export const makeReducer = ({ initial, actions }) => (state = initial, action) => {
  const { type, payload } = action;
  return type in actions ? actions[type](state, payload) : state;
};
