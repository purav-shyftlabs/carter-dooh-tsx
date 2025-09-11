import { useMemo } from 'react';
import { legacy_createStore as createStore, applyMiddleware, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware from 'redux-thunk';
import { REDUX_ACTION } from '../types/common';
import reducers, { IRootState } from './reducers';

let store: Store<IRootState, REDUX_ACTION> | undefined;

export function initStore(initialState: IRootState) {
  return createStore(reducers, initialState as any, composeWithDevTools(applyMiddleware(thunkMiddleware)));
}

export const initializeStore = (preloadedState?: IRootState) => {
  let _store = store ?? initStore(preloadedState as any);

  // After navigating to a page with an initial Redux state, merge that state
  // with the current state in the store, and create a new store
  if (preloadedState && store) {
    _store = initStore({
      ...store.getState(),
      ...preloadedState,
    });
    // Reset the current store
    store = undefined;
  }

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store;
  // Create the store once in the client
  if (!store) store = _store;
  return _store;
};

export function useStore(initialState?: IRootState) {
  return useMemo(() => initializeStore(initialState), [initialState]);
}

export const getStore = (): Store<IRootState, REDUX_ACTION> | undefined => {
  return store;
};
