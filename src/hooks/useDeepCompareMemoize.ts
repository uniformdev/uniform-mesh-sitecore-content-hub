import { useRef } from 'react';
import { dequal } from 'dequal';

export const useDeepCompareMemoize = <T>(value: T) => {
  const ref = useRef<T>(value);

  if (!dequal(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
};
