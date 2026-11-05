import { createContext, useContext } from 'react';

export const ReducedMotionContext = createContext(false);

export function useReducedMotionSetting() {
  return useContext(ReducedMotionContext);
}
