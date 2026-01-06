import { useEffect } from 'react';

import { LoadingOverlay, Callout } from '@uniformdev/mesh-sdk-react';
import { VerticalRhythm } from '@uniformdev/design-system';

import { useAuthContext, useGetAssetDetails, useIsInitialLoading } from '@hooks';
import { Asset } from '@lib';
import { AssetPreview } from './AssetPreview';

export const AssetPreviewWrapper = ({
  mode,
  assetId,
  onAssetSelect,
  onClose,
}: {
  mode: 'library' | 'parameter';
  assetId: string;
  onAssetSelect: (asset: Asset) => void;
  onClose?: () => void;
}) => {
  const { client } = useAuthContext();

  const {
    value: asset,
    loading: isAssetLoading,
    retry: refreshAsset,
  } = useGetAssetDetails({
    client,
    id: assetId,
  });

  const isInitialLoading = useIsInitialLoading(isAssetLoading);

  useEffect(() => {
    // up-to-date asset metadata is important only in parameter mode
    if (mode !== 'parameter') {
      return;
    }

    const handler = () => {
      if (document.visibilityState === 'visible') {
        refreshAsset();
      }
    };

    window.addEventListener('visibilitychange', handler, { passive: true });

    return () => window.removeEventListener('visibilitychange', handler);
  }, [refreshAsset, mode]);

  return (
    <VerticalRhythm>
      <LoadingOverlay isActive={isInitialLoading} statusMessage="Loading asset..." />
      {!isAssetLoading && !asset ? (
        <Callout type="error" title="Asset not found">
          Could not load the asset with ID: {assetId}
        </Callout>
      ) : null}
      {asset ? (
        <AssetPreview mode={mode} asset={asset} onAssetSelect={onAssetSelect} onClose={onClose} />
      ) : null}
    </VerticalRhythm>
  );
};
