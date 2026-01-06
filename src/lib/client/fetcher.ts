import pThrottle from 'p-throttle';
import pRetry from 'p-retry';

import { ApiRequestPayload } from '@lib';
import { ApiError, RateLimitError } from './errors';
import { isAbsoluteUrl } from 'next/dist/shared/lib/utils';

export type ApiFetcher = <TResult>(payload: Omit<ApiRequestPayload, 'token'>) => Promise<TResult | null>;

export const createInBrowserFetcher = ({
  apiHost,
  token,
}: {
  apiHost: string;
  token: string;
  rateLimit: number;
}): ApiFetcher => {
  return createFetcherInternal({
    apiHost,
    token,
    doFetch: async (payload: ApiRequestPayload) => {
      return fetch(payload.apiUrl, {
        method: payload.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.token}`,
        },
      });
    },
  });
};

export const createCorsFetcher = ({ apiHost, token }: { apiHost: string; token: string }): ApiFetcher => {
  return createFetcherInternal({
    apiHost,
    token,
    doFetch: async (payload: ApiRequestPayload) => {
      return await fetch('/api/content-hub', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
  });
};

const createFetcherInternal = ({
  apiHost,
  token,
  doFetch,
}: {
  apiHost: string;
  token: string;
  doFetch: (payload: ApiRequestPayload) => Promise<Response>;
}): ApiFetcher => {
  if (!apiHost) {
    throw new Error('missing apiHost');
  }

  if (!token) {
    throw new Error('missing token');
  }

  // https://doc.sitecore.com/ch/en/developers/cloud-dev/throttling.html
  const throttler = pThrottle({
    limit: 15,
    interval: 1000,
    strict: true,
  });

  const validApiHost = apiHost.endsWith('/') ? apiHost.slice(0, -1) : apiHost;

  return async <TResult>(payload: Omit<ApiRequestPayload, 'token'>): Promise<TResult | null> => {
    if (!payload?.apiUrl) {
      return null;
    }

    const apiUrl = isAbsoluteUrl(payload.apiUrl) ? payload.apiUrl : `${validApiHost}${payload.apiUrl}`;

    const MAX_ATTEMPTS = 3;

    return pRetry<TResult | null>(
      throttler(async (attemptCount) => {
        if (attemptCount > MAX_ATTEMPTS) {
          return null;
        }

        const response = await doFetch({
          ...payload,
          apiUrl,
          token,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new RateLimitError(apiUrl);
          }

          throw new ApiError(response.status, apiUrl);
        }

        try {
          const json: TResult = await response.json();
          return json;
        } catch (error: unknown) {
          if (error instanceof Error) {
            // eslint-disable-next-line no-console
            console.warn(error.message);
          }
        }

        return null;
      }),
      {
        retries: MAX_ATTEMPTS,
        factor: 1.66,
        onFailedAttempt: (error) => {
          if (
            error instanceof ApiError &&
            error.statusCode >= 400 &&
            error.statusCode < 500 &&
            error.statusCode !== 429 &&
            error.statusCode !== 408
          ) {
            // We don't want to retry 4xx (client-side issues), throwing here will prevent
            // further retries
            throw error;
          }
        },
      }
    );
  };
};
