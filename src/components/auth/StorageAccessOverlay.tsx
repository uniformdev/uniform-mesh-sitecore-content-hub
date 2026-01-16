import { ReactNode } from 'react';
import { Button, Callout, Link, LoadingOverlay, VerticalRhythm } from '@uniformdev/design-system';

import { useStorageAccess } from '@hooks';
import { Delayed } from '@components/Delayed';

export const StorageAccessOverlay = ({ children }: { children: ReactNode }) => {
  // Self-hosted integration requires third-party cookies to be allowed to store `next-auth` cookies
  const { hasStorageAccess, requestStorageAccess } = useStorageAccess();

  if (hasStorageAccess === undefined) {
    return (
      <Delayed delayMs={500}>
        <LoadingOverlay isActive />
      </Delayed>
    );
  }

  if (!hasStorageAccess) {
    return (
      <Callout type="caution">
        <VerticalRhythm gap="md">
          <b>Self-hosted integration requires third-party cookies to be allowed.</b>
          <Button type="button" buttonType="tertiary" onClick={requestStorageAccess}>
            Allow third-party cookies
          </Button>

          <VerticalRhythm gap="sm">
            <b>If browser has rejected the request without prompting:</b>
            <ul style={{ listStyle: 'disc', paddingLeft: '1rem' }}>
              <li>
                Try to <Link href={window.location.origin} text="visit the site" external /> first. Some
                browsers may reject third-party cookies requests if a user has not visited the site.
              </li>
              <li>
                Safari: disable &quot;Prevent cross-site tracking&quot; in &quot;Privacy&quot; settings to use
                third-party cookies.
              </li>
            </ul>
          </VerticalRhythm>
        </VerticalRhythm>
      </Callout>
    );
  }

  return <>{children}</>;
};
