import { useMeshLocation } from '@uniformdev/mesh-sdk-react';

import { IntegrationSettings } from '@lib';

export function useIntegrationSettings(expectValidated: true): IntegrationSettings;
export function useIntegrationSettings(expectValidated: false): IntegrationSettings | undefined;
export function useIntegrationSettings(expectValidated: boolean = true): IntegrationSettings | undefined {
  const { metadata } = useMeshLocation();

  const settings = metadata.settings as IntegrationSettings | undefined;

  // the caller is sure that settings was already validated
  if (expectValidated) {
    // fallback to empty object, just in case
    return settings ?? {};
  }

  return settings;
}
