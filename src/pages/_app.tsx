import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';

import { IconsProvider } from '@uniformdev/design-system';
import { MeshApp } from '@uniformdev/mesh-sdk-react';

import { AuthProvider } from '@hooks';
import { AuthorizationOverlay } from '@components/auth/AuthorizationOverlay';

import '../styles/global.css';
import { StorageAccessOverlay } from '@components/auth/StorageAccessOverlay';

const PAGE_WITHOUT_MESH_LOCATION = ['/_error', '/'];

const LOGIN_PAGE = '/login';
const SETTINGS_PAGE = '/settings';

const App = ({ Component, pageProps }: AppProps) => {
  const { pathname } = useRouter();

  if (PAGE_WITHOUT_MESH_LOCATION.includes(pathname)) {
    return <Component {...pageProps} />;
  }

  if (pathname === LOGIN_PAGE) {
    return (
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
    );
  }

  if (pathname === SETTINGS_PAGE) {
    return (
      <MeshApp>
        <IconsProvider>
          <Component {...pageProps} />
        </IconsProvider>
      </MeshApp>
    );
  }

  return (
    <MeshApp>
      <IconsProvider>
        <StorageAccessOverlay>
          <AuthProvider>
            <AuthorizationOverlay>
              <Component {...pageProps} />
            </AuthorizationOverlay>
          </AuthProvider>
        </StorageAccessOverlay>
      </IconsProvider>
    </MeshApp>
  );
};

export default App;
