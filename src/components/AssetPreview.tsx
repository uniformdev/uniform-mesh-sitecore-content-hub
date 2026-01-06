import { useCallback, useMemo, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import { css } from '@emotion/react';

import {
  Button,
  HorizontalRhythm,
  Image,
  ImageBroken,
  Link,
  VerticalRhythm,
  DescriptionList,
  ScrollableList,
  Icon,
  useShortcut,
  getFormattedShortcut,
  Callout,
  LoadingIndicator,
} from '@uniformdev/design-system';

import { Asset, buildAssetRelativeUrl, getReadableFileSize, IS_DEV_MODE } from '@lib';
import { useAuthContext, useGetAssetPublicLinks, useIntegrationSettings } from '@hooks';

type AssetPreviewProps = {
  mode: 'library' | 'parameter';
  asset: Asset;
  onAssetSelect: (asset: Asset) => void;
  onClose?: () => void;
};

export const AssetPreview = ({ mode, asset, onAssetSelect, onClose }: AssetPreviewProps) => {
  const [currentAsset, setCurrentAsset] = useState<Asset>(asset);

  if (IS_DEV_MODE) {
    // eslint-disable-next-line no-console
    console.log('[AssetPreview] currentAsset', currentAsset);
  }

  const properties = useMemo(() => getAssetProperties(currentAsset), [currentAsset]);

  const closeShortcut = useShortcut({
    shortcut: 'esc',
    macShortcut: 'esc',
    handler: () => onClose?.(),
  });

  const onPublicUrlUpdate = useCallback((publicUrl: string) => {
    setCurrentAsset((prev) => ({ ...prev, publicUrl }));
  }, []);

  return (
    <HorizontalRhythm gap="sm" style={{ display: 'grid', gridTemplateColumns: '7fr 5fr' }}>
      <VerticalRhythm style={{ height: '100vh' }} justify="center" align="center">
        <MediaPreview asset={currentAsset} />
      </VerticalRhythm>
      <VerticalRhythm
        gap="sm"
        style={{ height: '100vh', padding: 'var(--spacing-xs)', wordBreak: 'break-word' }}
      >
        <HorizontalRhythm
          gap="md"
          align="center"
          justify="space-between"
          style={{ paddingTop: 'var(--spacing-sm)' }}
        >
          <HorizontalRhythm gap="md" align="center">
            {mode === 'parameter' ? (
              <SelectAssetButton asset={currentAsset} onClick={() => onAssetSelect(currentAsset)} />
            ) : null}
            <Link text="Open in Content Hub" href={currentAsset.editUrl || '#'} external />
          </HorizontalRhythm>

          {onClose ? (
            <Button
              type="button"
              onClick={onClose}
              buttonType="ghost"
              tooltip={getFormattedShortcut(closeShortcut.shortcut)}
              tooltipOptions={{
                gutter: 0,
              }}
              style={{ alignSelf: 'flex-end' }}
            >
              <Icon icon="close" iconColor="currentColor" size={24} />
            </Button>
          ) : null}
        </HorizontalRhythm>

        {mode === 'parameter' ? (
          <PublicLink asset={currentAsset} onPublicUrlUpdate={onPublicUrlUpdate} />
        ) : null}

        <ScrollableList label="Properties">
          <DescriptionList items={properties} variant="vertical" />
        </ScrollableList>
      </VerticalRhythm>
    </HorizontalRhythm>
  );
};

const getAssetProperties = (asset: Asset): Array<{ label: string; value: string | number | boolean }> => {
  const properties = [
    { label: 'ID', value: String(asset.id) },
    { label: 'Name', value: asset.name },
    asset.description ? { label: 'Description', value: asset.description } : null,
    asset.altText ? { label: 'Alt Text', value: asset.altText } : null,
    { label: 'Mime Type', value: asset.mimeType || 'n/a' },
    { label: 'Size', value: getReadableFileSize(asset.size) || 'n/a' },
    asset.width ? { label: 'Width', value: asset.width } : null,
    asset.height ? { label: 'Height', value: asset.height } : null,
    { label: 'Created On', value: asset.createdOn?.toLocaleString() || 'n/a' },
    { label: 'Modified On', value: asset.modifiedOn?.toLocaleString() || 'n/a' },
    { label: 'Approval Date', value: asset.approvalDate?.toLocaleString() || 'n/a' },
    { label: 'Approved By', value: asset.approvedBy || 'n/a' },
  ];

  return properties.filter((x) => !!x);
};

const SelectAssetButton = ({ asset, onClick }: { asset: Asset; onClick: () => void }) => {
  const tooltip = useMemo(() => {
    if (!asset.publicUrl) {
      return <span>Public link is required to use the asset</span>;
    }

    return null;
  }, [asset.publicUrl]);

  return (
    <Button type="button" buttonType="secondary" disabled={!!tooltip} onClick={onClick} tooltip={tooltip}>
      Select Asset
    </Button>
  );
};

const PublicLink = ({
  asset,
  onPublicUrlUpdate,
}: {
  asset: Asset;
  onPublicUrlUpdate: (publicLink: string) => void;
}) => {
  const settings = useIntegrationSettings(true);
  const { client } = useAuthContext();

  const {
    value: publicLinks,
    loading: isLoadingPublicLinks,
    retry: refreshPublicLinks,
  } = useGetAssetPublicLinks({
    client,
    id: asset.id,
    rendition: 'downloadOriginal',
  });

  if (IS_DEV_MODE) {
    // eslint-disable-next-line no-console
    console.log('[AssetPreview] publicLinks', publicLinks);
  }

  const publicLink = publicLinks?.at(0);

  const [status, setStatus] = useState<'idle' | 'loading' | 'pending-link' | 'error'>('idle');

  useUpdateEffect(() => {
    if (!publicLink?.publicUrl) {
      return;
    }

    const abortController = new AbortController();

    if (publicLink.status === 'Completed') {
      setStatus('idle');
      onPublicUrlUpdate(publicLink.publicUrl);
    } else if (publicLink.status === 'Pending') {
      setStatus('pending-link');

      const timer = setTimeout(() => {
        refreshPublicLinks();
      }, 2000);

      abortController.signal.addEventListener('abort', () => clearTimeout(timer));
    }

    return () => abortController.abort();
  }, [publicLink, onPublicUrlUpdate]);

  const createPublicLink = useCallback(
    async ({ apiHost, assetId, cultures }: { apiHost: string; assetId: number; cultures: string[] }) => {
      if (!apiHost || !assetId) {
        return;
      }

      try {
        setStatus('loading');

        const relativeUrl = buildAssetRelativeUrl(asset.name);

        const result = await client?.createAssetPublicLink({
          apiHost,
          assetId,
          cultures,
          rendition: 'downloadOriginal',
          relativeUrl,
        });

        if (result?.id) {
          refreshPublicLinks();
          setStatus('idle');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    },
    [client, refreshPublicLinks, asset.name]
  );

  if (status === 'pending-link') {
    return (
      <Callout type="info">
        Waiting for public link to be processed... <LoadingIndicator size="sm" />
      </Callout>
    );
  }

  return !publicLink?.publicUrl && !isLoadingPublicLinks ? (
    <Callout type="caution" title="No public link is available for the original asset">
      <Button
        type="button"
        buttonType="tertiary"
        onClick={async () =>
          await createPublicLink({
            apiHost: settings.apiHost ?? '',
            assetId: asset.id,
            cultures: asset.cultures,
          })
        }
        disabled={status === 'loading'}
      >
        Create public link {status === 'loading' ? <LoadingIndicator size="sm" /> : null}
      </Button>
    </Callout>
  ) : null;
};

const mediaPreviewStyles = css`
  flex-grow: 1;
  background: var(--gray-50);
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: var(--spacing-base);
  overflow: hidden;

  video {
    width: 100%;
    height: auto;
  }

  img {
    object-fit: scale-down;
  }
`;

const MediaPreview = ({ asset }: { asset: Asset }) => {
  const [mediaPlaybackError, setMediaPlaybackError] = useState<boolean>(false);

  const originalUrl = asset.originalUrl;

  if (!asset.type || mediaPlaybackError || !originalUrl) {
    return <ImageBroken />;
  }

  if (asset.type === 'image') {
    return <ImagePreview alt={asset.name} src={originalUrl} />;
  }

  if (asset.type === 'video') {
    return (
      <div css={mediaPreviewStyles}>
        <video controls src={originalUrl} onError={() => setMediaPlaybackError(true)} />
      </div>
    );
  }

  if (asset.type === 'audio') {
    return (
      <div css={mediaPreviewStyles}>
        <audio controls src={originalUrl} onError={() => setMediaPlaybackError(true)} />
      </div>
    );
  }

  // fallback image preview if available
  if (asset.previewUrl) {
    return <ImagePreview alt={asset.name} src={asset.previewUrl} />;
  }

  return <ImageBroken />;
};

const ImagePreview = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Image
      alt={alt}
      src={src}
      style={{
        objectFit: 'scale-down',
        height: '100%',
        width: '100%',
      }}
    />
  );
};
