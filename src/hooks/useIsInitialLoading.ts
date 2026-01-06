import { useRef } from 'react';

export const useIsInitialLoading = (isLoading: boolean) => {
  const state = useRef(true);

  if (!isLoading) {
    state.current = false;
  }

  return state.current;
};
