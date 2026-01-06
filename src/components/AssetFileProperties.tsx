import { HorizontalRhythm } from '@uniformdev/design-system';

import { SearchEntryPreview } from '@lib';

export const AssetFileProperties = ({ asset }: { asset: SearchEntryPreview }) => {
  return (
    <HorizontalRhythm gap="sm" align="center" style={{ minWidth: 0 }}>
      {asset.mimeType ? (
        <small>
          <strong>Media type:</strong> {asset.mimeType ?? 'unknown'}
        </small>
      ) : null}
    </HorizontalRhythm>
  );
};
