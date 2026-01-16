import { ReactNode, useMemo } from 'react';
import { Callout, LoadingOverlay } from '@uniformdev/mesh-sdk-react';
import { DashedBox, Heading, HorizontalRhythm, VerticalRhythm } from '@uniformdev/design-system';

import { useAuthContext, useIntegrationSettings } from '@hooks';
import { validateSettings } from '@lib';
import { LoginButton } from './LoginButton';
import { Delayed } from '../Delayed';

import ErrorSettingsCallout from '../ErrorSettingsCallout';

export const AuthorizationOverlay = ({ children }: { children: ReactNode }) => {
  const settings = useIntegrationSettings(false);

  const { status, refresh: refreshAuth } = useAuthContext();

  const isValidSettings = useMemo(() => validateSettings(settings), [settings]);

  if (!settings || status === 'loading') {
    return (
      <Delayed delayMs={500}>
        <LoadingOverlay isActive />
      </Delayed>
    );
  }

  if (!isValidSettings) {
    return <ErrorSettingsCallout />;
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
              <LoginButton oauthTenant="content-hub" onLoggedIn={refreshAuth} />
            </HorizontalRhythm>
          </VerticalRhythm>
        </VerticalRhythm>
      </DashedBox>
    );
  }

  return <>{children}</>;
};
