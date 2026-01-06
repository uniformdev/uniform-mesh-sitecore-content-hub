import { ReactNode, useMemo, useState } from 'react';
import { Callout, LoadingOverlay } from '@uniformdev/mesh-sdk-react';
import { DashedBox, Heading, HorizontalRhythm, Link, VerticalRhythm } from '@uniformdev/design-system';

import { useAuthContext, useIntegrationSettings } from '@hooks';
import { validateSettings } from '@lib';
import { LoginButton } from './LoginButton';
import { Delayed } from '../Delayed';

import ErrorSettingsCallout from '../ErrorSettingsCallout';
import { useEffectOnce } from 'react-use';

export const AuthorizationOverlay = ({ children }: { children: ReactNode }) => {
  const settings = useIntegrationSettings(false);

  const { status, refresh } = useAuthContext();

  const isValidSettings = useMemo(() => validateSettings(settings), [settings]);

  const [hasStorageAccess, setHasStorageAccess] = useState<boolean | undefined>(undefined);

  // Self-hosted integration requires third-party cookies to be allowed to store `next-auth` cookies
  useEffectOnce(() => {
    const hostname = window.location.hostname;
    if (hostname === 'uniform.app' || hostname.endsWith('.uniform.app')) {
      setHasStorageAccess(true);
    } else {
      document.hasStorageAccess().then((value) => setHasStorageAccess(value));
    }
  });

  if (!settings || status === 'loading' || hasStorageAccess === undefined) {
    return (
      <Delayed delayMs={500}>
        <LoadingOverlay isActive />
      </Delayed>
    );
  }

  if (!isValidSettings) {
    return <ErrorSettingsCallout />;
  }

  if (!hasStorageAccess) {
    return (
      <Callout type="caution">
        <VerticalRhythm gap="sm">
          <b>
            Self-hosted integration requires third-party cookies to be allowed. How to enable third-party
            cookies:
          </b>
          <ul>
            <li>
              <span>Chrome:</span>{' '}
              <Link
                href="https://support.google.com/chrome/answer/9564"
                text="Delete, allow, and manage cookies in Chrome"
                external={true}
              />
            </li>
            <li>
              <span>Edge:</span>{' '}
              <Link
                href="https://support.microsoft.com/en-gb/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d"
                text="Manage cookies in Microsoft Edge"
                external={true}
              />
            </li>
            <li>
              <span>Firefox:</span>{' '}
              <Link
                href="https://support.mozilla.org/en-US/kb/third-party-cookies-firefox-tracking-protection"
                text="Third-party cookies and Firefox tracking protection"
                external={true}
              />
            </li>
            <li>Safari: disable &quot;Prevent cross-site tracking&quot; in &quot;Privacy&quot; settings.</li>
          </ul>
        </VerticalRhythm>
      </Callout>
    );
  }

  if (status === 'error') {
    return <Callout type="error">Authentication could not be resolved.</Callout>;
  }

  if (status === 'unauthenticated') {
    return (
      <DashedBox>
        <VerticalRhythm gap="base" justify="center" align="center">
          <VerticalRhythm gap="xs">
            <Heading withMarginBottom={false}>Authentication required</Heading>
            <div>You need to log in to proceed.</div>
            <HorizontalRhythm justify="center" align="center">
              <LoginButton oauthTenant="content-hub" onLoggedIn={refresh} />
            </HorizontalRhythm>
          </VerticalRhythm>
        </VerticalRhythm>
      </DashedBox>
    );
  }

  return <>{children}</>;
};
