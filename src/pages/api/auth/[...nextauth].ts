import NextAuth, { AuthOptions, TokenSet } from 'next-auth';
import { OAuthConfig } from 'next-auth/providers/oauth';

import { OAuthSession, OAuthTenant } from '@lib';

if (!process.env.AUTH_APP_ID) {
  throw new Error('OAUTH_APP_ID is not set');
}

if (!process.env.AUTH_APP_SECRET) {
  throw new Error('OAUTH_APP_SECRET is not set');
}

const SERVER_URL = getServerUrl();
// eslint-disable-next-line no-console
console.debug('SERVER_URL', SERVER_URL);

if (!SERVER_URL || !isValidUrl(SERVER_URL)) {
  throw new Error('SERVER_URL is not a valid URL');
}

const SERVER_DOMAIN = new URL(SERVER_URL).hostname;

const CONTENT_HUB_ACCOUNT_URL = process.env.CONTENT_HUB_ACCOUNT_URL;
if (!CONTENT_HUB_ACCOUNT_URL || !isValidUrl(CONTENT_HUB_ACCOUNT_URL)) {
  throw new Error('CONTENT_HUB_ACCOUNT_URL is not a valid URL');
}

// Customer may use several integrations with next-auth
const COOKIE_PREFIX = 'contenthub-';

const contentHub = initProvider({
  tenant: 'content-hub',
  name: 'content-hub',
  clientId: process.env.AUTH_APP_ID,
  clientSecret: process.env.AUTH_APP_SECRET,
});

const authOptions: AuthOptions = {
  // debug: true,
  providers: [contentHub],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.tenant = account.provider;
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at;
        token.refreshToken = account.refresh_token;
      }

      if (Date.now() >= (token.accessTokenExpires as number)) {
        if (!token.refreshToken) {
          throw new Error('expired access token');
        }

        const newToken = await refreshToken({
          tenant: 'content-hub',
          clientId: contentHub.clientId!,
          clientSecret: contentHub.clientSecret!,
          refreshToken: token.refreshToken as string,
        });

        token.accessToken = newToken.access_token;
        token.accessTokenExpires = newToken.expires_at;
        token.refreshToken = newToken.refresh_token;

        return token;
      }

      return token;
    },
    async session({ session, token }) {
      const current = session as OAuthSession;

      current.accessToken = token.accessToken as string;
      current.tenant = token.tenant as string;

      return session;
    },
  },
  cookies: {
    // - Default `LAX` mode does not work for mesh iframe
    // - add prefix to avoid conflicts with other `next-auth`
    sessionToken: {
      name: `${COOKIE_PREFIX}next-auth.session-token`,
      options: {
        domain: SERVER_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        // keep session cookie for 30 days, since we have refresh token
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: `${COOKIE_PREFIX}next-auth.callback-url`,
      options: {
        domain: SERVER_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      },
    },
    csrfToken: {
      name: `${COOKIE_PREFIX}next-auth.csrf-token`,
      options: {
        domain: SERVER_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      },
    },
  },
};

export default NextAuth(authOptions);

function initProvider({
  tenant,
  name,
  clientId,
  clientSecret,
}: {
  tenant: OAuthTenant;
  name: string;
  clientId: string;
  clientSecret: string;
}): OAuthConfig<{
  id: string;
  email: string;
}> {
  return {
    id: tenant,
    name,
    type: 'oauth',
    clientId,
    clientSecret,
    checks: ['state'],
    authorization: {
      url: `${CONTENT_HUB_ACCOUNT_URL}/oauth/authorize`,
    },
    token: {
      async request(context) {
        if (context.checks.state !== context.params.state) {
          throw new Error(`state mismatch, expected: ${context.checks.state}, got: ${context.params.state}`);
        }

        const authorizationCode = context.params.code;
        if (!authorizationCode) {
          throw new Error('missing authorization code');
        }

        const tokenSet = await obtainAccessToken({
          tenant,
          clientId,
          clientSecret,
          authorizationCode,
        });

        return {
          tokens: tokenSet,
        };
      },
    },
    userinfo: {
      async request(_context) {
        // any way to get the current user name (`/api/entities/me` does not exist) ?
        return {
          email: '',
        };
      },
    },
    profile: async (profile, token) => {
      return {
        // we could not resolve real user info, but we still need to return some `id` to satisfy the `next-auth`
        id: token.access_token!,
        email: profile.email,
      };
    },
  };
}

async function obtainAccessToken({
  tenant,
  clientId,
  clientSecret,
  authorizationCode,
}: {
  tenant: OAuthTenant;
  clientId: string;
  clientSecret: string;
  authorizationCode: string;
}): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${SERVER_URL}/api/auth/callback/${tenant}`,
  });

  return getAccessToken(tenant, body);
}

async function refreshToken({
  tenant,
  clientId,
  clientSecret,
  refreshToken,
}: {
  tenant: OAuthTenant;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  return getAccessToken(tenant, body);
}

const getAccessToken = async (_tenant: OAuthTenant, body: URLSearchParams): Promise<TokenSet> => {
  const response = await fetch(`${CONTENT_HUB_ACCOUNT_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Could not get access token: [${response.status}] ${await response.text()}`);
  }

  const json = (await response.json()) as {
    token_type: string;
    access_token: string;
    expires_in: number | string;
    refresh_token?: string;
  };

  const expires_in_sec = Number(json.expires_in) > 0 ? Number(json.expires_in) : 3600;

  // Consider the token as expired a bit earlier to minimize risk of UI expiry
  const EXPIRES_GAP_SEC = 5 * 60;

  return {
    access_token: json.access_token,
    expires_at: Date.now() + (expires_in_sec - EXPIRES_GAP_SEC) * 1000,
    refresh_token: json.refresh_token,
    token_type: json.token_type,
  };
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getServerUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.VERCEL) {
    if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }

    if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) {
      return `https://${process.env.VERCEL_BRANCH_URL}`;
    }
  }

  return '';
}
