import { useCallback } from 'react';

import { useMeshLocation } from '@uniformdev/mesh-sdk-react';

import { AssetPreviewDialog, Asset } from '@lib';
import { AssetPreviewWrapper } from '@components/AssetPreviewWrapper';

export default function AssetLibraryLocation() {
  const { dialogContext } = useMeshLocation();

  const onAssetSelect = useCallback(
    (asset: Asset) => {
      const result: AssetPreviewDialog['result'] = {
        asset,
      };

      dialogContext?.returnDialogValue(result);
    },
    [dialogContext]
  );

  const { id, mode } = (dialogContext?.params ?? {}) as AssetPreviewDialog['params'];

  return <AssetPreviewWrapper mode={mode} assetId={id} onAssetSelect={onAssetSelect} />;
}
