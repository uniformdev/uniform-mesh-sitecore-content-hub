import { signOut } from 'next-auth/react';

import { Button } from '@uniformdev/mesh-sdk-react';
import { HorizontalRhythm } from '@uniformdev/design-system';

export function LogoutButton({
  isAuthenticated,
  email,
  authRefresh,
}: {
  isAuthenticated: boolean;
  email: string | undefined;
  authRefresh: () => void;
}) {
  return isAuthenticated ? (
    <HorizontalRhythm gap="sm" justify="flex-start" align="center">
      <span>{email || ''}</span>
      <Button
        buttonType="ghostDestructive"
        size="sm"
        onClick={async () => {
          await signOut({ redirect: false });
          authRefresh();
        }}
        style={{ outline: 'unset', padding: 'var(--spacing-sm)' }}
      >
        Logout
      </Button>
    </HorizontalRhythm>
  ) : null;
}
