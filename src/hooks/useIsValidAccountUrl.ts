import { useState } from 'react';
import { useDebounce } from 'react-use';

export const useIsValidAccountUrl = (url: string): boolean | undefined => {
  const [isValid, setIsValid] = useState<boolean>();

  useDebounce(
    () => {
      if (!url) {
        setIsValid(undefined);
        return;
      }

      fetch('/api/status-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }).then((res) => {
        setIsValid(res.status === 200 || res.status === 302);
      });
    },
    250,
    [url]
  );

  return isValid;
};
