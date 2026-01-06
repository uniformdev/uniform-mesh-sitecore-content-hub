import { useAsyncRetry } from 'react-use';

import { Asset, ContentHubClient, mapEntityToAsset } from '@lib';
import { useIntegrationSettings } from './useIntegrationSettings';

export const useGetAssetDetails = ({
  client,
  id,
}: {
  client: ContentHubClient | null | undefined;
  id: string;
}): ReturnType<typeof useAsyncRetry<Asset | null>> => {
  const settings = useIntegrationSettings(true);

  return useAsyncRetry(async () => {
    if (!client || !id) {
      return null;
    }

    const assetApiResult = await client.getEntity({
      id,
    });

    const asset = assetApiResult
      ? mapEntityToAsset({
          entity: assetApiResult,
          apiHost: settings.apiHost,
          culture: settings.culture,
        })
      : null;

    return asset;
  }, [client, id, settings.apiHost, settings.culture]);
};
