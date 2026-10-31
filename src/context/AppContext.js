import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Consent and settings (US-04) plus the optional local history of checks.
// Nothing leaves the device: history is off by default and lives only in AsyncStorage.
export const AppContext = createContext(null);

const KEY = 'truerate:v1';
const MAX_HISTORY = 50;

const initialState = {
  ready: false,
  consented: false,
  saveHistory: false,
  history: [], // [{ id, input, result }]
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.data, ready: true };
    case 'CONSENT':
      return { ...state, consented: true };
    case 'SET_SAVE_HISTORY':
      // turning history off also forgets what was stored
      return { ...state, saveHistory: action.value, history: action.value ? state.history : [] };
    case 'ADD_CHECK':
      if (!state.saveHistory) return state;
      return { ...state, history: [action.entry, ...state.history].slice(0, MAX_HISTORY) };
    case 'REMOVE_CHECK':
      return { ...state, history: state.history.filter((h) => h.id !== action.id) };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'RESET':
      return { ...initialState, ready: true };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => dispatch({ type: 'HYDRATE', data: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'HYDRATE', data: {} }));
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    const { consented, saveHistory, history } = state;
    AsyncStorage.setItem(KEY, JSON.stringify({ consented, saveHistory, history })).catch(() => {});
  }, [state]);

  const consent = useCallback(() => dispatch({ type: 'CONSENT' }), []);
  const setSaveHistory = useCallback(
    (value) => dispatch({ type: 'SET_SAVE_HISTORY', value }),
    []
  );
  const addCheck = useCallback(
    (input, result) =>
      dispatch({ type: 'ADD_CHECK', entry: { id: String(Date.now()), input, result } }),
    []
  );
  const removeCheck = useCallback((id) => dispatch({ type: 'REMOVE_CHECK', id }), []);
  const clearHistory = useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []);
  const resetAll = useCallback(() => {
    AsyncStorage.removeItem(KEY).catch(() => {});
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      consent,
      setSaveHistory,
      addCheck,
      removeCheck,
      clearHistory,
      resetAll,
    }),
    [state, consent, setSaveHistory, addCheck, removeCheck, clearHistory, resetAll]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
