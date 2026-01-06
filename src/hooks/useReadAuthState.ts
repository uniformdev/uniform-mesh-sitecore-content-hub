import { useAsyncRetry } from 'react-use';
import pLimit from 'p-limit';

import { OAuthSession } from '@lib';
import { getSession } from 'next-auth/react';

export type AuthState =
  | {
      status: 'loading';
      apiHost: undefined;
      accessToken: undefined;
      email: undefined;
    }
  | {
      status: 'unauthenticated';
      apiHost: string;
      accessToken: undefined;
      email: undefined;
    }
  | {
      status: 'authenticated';
      apiHost: string;
      accessToken: string;
      email: string;
    };

export function useReadAuthState({
  apiHost,
}: {
  apiHost?: string;
}): ReturnType<typeof useAsyncRetry<AuthState>> {
  return useAsyncRetry<AuthState>(async () => {
    if (!apiHost) {
      throw new Error('API host is not configured');
    }

    const session = await readSession();
    if (session?.accessToken) {
      return {
        status: 'authenticated',
        apiHost,
        accessToken: session.accessToken,
        email: session.user?.email ?? '',
      };
    }

    return {
      status: 'unauthenticated',
      apiHost,
    };
  }, [apiHost]);
}

const limit = pLimit(1);

const readSession = async () => {
  // Avoid simultaneous calls to getSession
  const session = await limit(() => getSession());
  return session as OAuthSession | undefined;
};
