import React from 'react';

import { LoadingOverlay, useMeshLocation } from '@uniformdev/mesh-sdk-react';

import { Asset, mapAssetToAssetParamValue, WELL_KNOWN_DEFINITION_NAME } from '@lib';
import { AssetLibrary } from '@components/AssetLibrary';
import { useAuthContext, useGetTaxonomyDefinitions, useIntegrationSettings } from '@hooks';

export default function AssetParameterLocation() {
  const { metadata, setValue } = useMeshLocation('assetParameter');

  const settings = useIntegrationSettings(true);
  const { client } = useAuthContext();

  const { value: taxonomyDefinitions } = useGetTaxonomyDefinitions({
    client,
    definitionNames: [WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA, ...(settings.taxonomyNames ?? [])],
  });

  const onAssetsSelected = React.useCallback(
    (contentHubAssets: Asset[]) => {
      const assets = contentHubAssets.map((asset) =>
        mapAssetToAssetParamValue({
          asset: asset,
          sourceId: metadata.sourceId,
        })
      );

      setValue(() => ({ newValue: assets }));
    },
    [setValue, metadata.sourceId]
  );

  if (!taxonomyDefinitions) {
    return <LoadingOverlay isActive statusMessage="Loading taxonomy..." />;
  }

  return (
    <AssetLibrary
      mode="parameter"
      allowedAssetTypes={metadata.allowedAssetTypes}
      taxonomyDefinitions={taxonomyDefinitions}
      onAssetsSelected={onAssetsSelected}
    />
  );
}
