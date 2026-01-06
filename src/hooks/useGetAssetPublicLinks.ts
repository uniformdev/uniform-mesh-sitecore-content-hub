import { useAsyncRetry } from 'react-use';

import { AssetPublicLink, ContentHubClient, getStringProperty, PublicLinkEntity, RenditionKey } from '@lib';

export const useGetAssetPublicLinks = ({
  client,
  id,
  rendition,
}: {
  client: ContentHubClient | null | undefined;
  id: number;
  rendition: RenditionKey;
}): ReturnType<typeof useAsyncRetry<AssetPublicLink[] | null>> => {
  return useAsyncRetry(async () => {
    if (!client || !id || !rendition) {
      return null;
    }

    const apiResult = await client.getChildRelations({
      parentId: id,
      relation: 'AssetToPublicLink',
    });

    if (!Array.isArray(apiResult?.items)) {
      return null;
    }

    return apiResult.items
      .map((item) => tryGetValidPublicLink(item.entity as PublicLinkEntity, rendition))
      .filter((link) => !!link);
  }, [client, id, rendition]);
};

const tryGetValidPublicLink = (entity: PublicLinkEntity, rendition: RenditionKey): AssetPublicLink | null => {
  if (entity.properties.IsDisabled) {
    return null;
  }

  // we expect stable urls with no expiration date
  if (entity.properties.ExpirationDate) {
    return null;
  }

  // we expect original content without cropping or something
  if (entity.properties.ConversionConfiguration) {
    return null;
  }

  const currentRendition = entity.properties.Resource as RenditionKey;
  if (currentRendition !== rendition) {
    return null;
  }

  if (!entity.public_link) {
    return null;
  }

  const status = getStringProperty(entity, 'Status');

  return {
    id: entity.id,
    rendition: currentRendition,
    publicUrl: entity.public_link,
    status: status === 'Completed' ? 'Completed' : status === 'Pending' ? 'Pending' : 'unknown',
  };
};
