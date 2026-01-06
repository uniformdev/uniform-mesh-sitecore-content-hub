import React from 'react';

import { AssetLibrary } from '@components/AssetLibrary';
import { useAuthContext, useGetTaxonomyDefinitions, useIntegrationSettings } from '@hooks';
import { LoadingOverlay } from '@uniformdev/design-system';
import { WELL_KNOWN_DEFINITION_NAME } from '@lib';

export default function AssetLibraryLocation() {
  const settings = useIntegrationSettings(true);
  const { client } = useAuthContext();

  const { value: taxonomyDefinitions } = useGetTaxonomyDefinitions({
    client,
    definitionNames: [WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA, ...(settings.taxonomyNames ?? [])],
  });

  if (!taxonomyDefinitions) {
    return <LoadingOverlay isActive statusMessage="Loading taxonomy..." />;
  }

  return (
    <AssetLibrary mode="library" allowedAssetTypes={undefined} taxonomyDefinitions={taxonomyDefinitions} />
  );
}
