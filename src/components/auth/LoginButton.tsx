import { ComponentProps, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

import { Button } from '@uniformdev/mesh-sdk-react';

import { OAuthTenant } from '@lib';

export function LoginButton({
  oauthTenant,
  disabled,
  onLoggedIn,
  variant,
  ...buttonProps
}: {
  oauthTenant: OAuthTenant | undefined;
  onLoggedIn: () => void;
  variant?: 'soft';
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'buttonType'>) {
  const popup = useRef<Window | null>(null);

  useEffect(() => {
    // waiting for the post message from the `/login` page
    const listener = ({ data, origin }: MessageEvent) => {
      if (origin === location.origin && data.type === 'oauth-login' && popup.current) {
        // when the received message with 'oauth-login' type, close the popup and notify subscribers
        if (!popup.current.closed) {
          popup.current.close();
        }

        onLoggedIn();
      }
    };

    addEventListener('message', listener);

    return () => removeEventListener('message', listener);
  }, [onLoggedIn]);

  return (
    <Button
      {...buttonProps}
      buttonType="primary"
      variant={variant}
      disabled={disabled}
      onClick={async () => {
        // explicitly sign-out to ensure we don't have an active session
        // otherwise `/login` page will be closed immediately
        await signOut({ redirect: false });

        const tokenUri = `${location.origin}/login?tenant=${oauthTenant ?? ''}`;
        const width = 600;
        const height = 800;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height;

        popup.current = window.open(
          tokenUri,
          'Login',
          `toolbar=no, menubar=no, scrollbars=on, width=${width}, height=${height}, top=${top}, left=${left}`
        );
      }}
    >
      Login
    </Button>
  );
}
