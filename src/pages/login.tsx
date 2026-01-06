import { LoadingOverlay } from '@uniformdev/mesh-sdk-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

export default function Login() {
  const { query } = useRouter();
  const { status, data } = useSession();

  useEffect(() => {
    if (!Object.keys(query).length) {
      return;
    }

    if (status === 'unauthenticated') {
      // if unauthenticated, redirect to OAuth login page
      const tenant = query.tenant as string;

      signIn(tenant, undefined);
    } else if (status === 'authenticated') {
      // after login, post message with 'content-hub-login' type to close the window
      window.opener.postMessage({ type: 'oauth-login' }, location.origin);
    }
  }, [status, data, query]);

  return (
    <main>
      <LoadingOverlay isActive={true} />
    </main>
  );
}
