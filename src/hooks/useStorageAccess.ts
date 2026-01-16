import { useCallback, useState } from 'react';
import { useEffectOnce } from 'react-use';

export const useStorageAccess = (): {
  hasStorageAccess: boolean | undefined;
  requestStorageAccess: () => Promise<void>;
} => {
  const [hasStorageAccess, setHasStorageAccess] = useState<boolean | undefined>(undefined);

  const requestStorageAccess = useCallback(async () => {
    try {
      await document.requestStorageAccess();
      setHasStorageAccess(true);
    } catch {
      setHasStorageAccess(false);
    }
  }, []);

  useEffectOnce(() => {
    const hostname = window.location.hostname;
    if (hostname === 'uniform.app' || hostname.endsWith('.uniform.app')) {
      setHasStorageAccess(true);
    } else {
      // will return false after iframe refresh and you need to request storage access again
      document.hasStorageAccess().then((hasAccess) => {
        if (hasAccess) {
          setHasStorageAccess(true);
        } else {
          // will fail on first in-hook request (because of no user action), but if already granted it would resolve properly
          requestStorageAccess();
        }
      });
    }
  });

  return { hasStorageAccess, requestStorageAccess };
};
