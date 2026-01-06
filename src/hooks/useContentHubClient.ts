import { useMemo } from 'react';

import { ContentHubClient } from '@lib';

export const useContentHubClient = ({
  apiHost,
  accessToken,
}: {
  apiHost?: string;
  accessToken?: string;
}): ContentHubClient | null => {
  return useMemo(() => {
    if (!apiHost || !accessToken) {
      return null;
    }

    return new ContentHubClient({ apiHost, accessToken });
  }, [apiHost, accessToken]);
};
