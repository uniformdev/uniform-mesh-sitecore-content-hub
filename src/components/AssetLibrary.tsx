import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { Filter, SearchAndFilter, useUniformMeshSdk } from '@uniformdev/mesh-sdk-react';

import { AssetCardGrid } from './AssetCardGrid';
import { AssetMediaCard } from './AssetMediaCard';
import { AssetFileProperties } from './AssetFileProperties';

import {
  AssetPreviewDialog,
  Asset,
  mapEntityToPreview,
  DEFAULT_SEARCH_LIMIT,
  SearchEntryPreview,
  SelectOption,
  IS_DEV_MODE,
  TaxonomyDefinition,
} from '@lib';
import { useAssetSearch, useAuthContext, useSearchFilters } from '@hooks';
import { HorizontalRhythm, InputSelect, Pagination, VerticalRhythm } from '@uniformdev/design-system';
import { LogoutButton } from '@components/auth/LogoutButton';
import { AssetPreviewWrapper } from '@components/AssetPreviewWrapper';
import { AssetDefinitionType } from '@uniformdev/assets';

const SORT_BY_OPTIONS: SelectOption[] = [
  { label: 'Modified on', value: 'modified_on' },
  { label: 'Created on', value: 'created_on' },
  { label: 'Approval date', value: 'ApprovalDate' },
  { label: 'Title', value: 'Title' },
];

const SORT_ORDER_OPTIONS: SelectOption[] = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

export type AssetLibraryProps = {
  mode: 'library' | 'parameter';
  allowedAssetTypes: AssetDefinitionType[] | undefined;
  taxonomyDefinitions: TaxonomyDefinition[];
  limit?: number;
  onAssetsSelected?: (assets: Asset[]) => void;
};

export const AssetLibrary = ({
  mode,
  allowedAssetTypes,
  taxonomyDefinitions,
  limit = DEFAULT_SEARCH_LIMIT,
  onAssetsSelected,
}: AssetLibraryProps) => {
  if (IS_DEV_MODE) {
    // eslint-disable-next-line no-console
    console.log('[AssetLibrary]', { allowedAssetTypes, taxonomyDefinitions });
  }

  const sdk = useUniformMeshSdk();
  const { client, status, email, refresh: authRefresh } = useAuthContext();

  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const searchRef = useRef<HTMLInputElement>(null);

  const handlePageChange = useCallback((_limit: number, offset: number) => {
    setOffset(offset);
    searchRef.current?.scrollIntoView();
  }, []);

  const handleKeywordChanged = useCallback((keyword: string) => {
    setKeyword(keyword);
    setOffset(0);
  }, []);

  const handleOpenPreview = useCallback(
    async (asset: SearchEntryPreview) => {
      const dialog = await sdk.openLocationDialog<AssetPreviewDialog['result'], AssetPreviewDialog['params']>(
        {
          locationKey: 'asset-preview',
          options: {
            params: {
              mode,
              id: asset.id,
            },
            width: 'wide',
            contentHeight: '80vh',
          },
        }
      );
      const result = dialog?.value;
      if (result?.asset?.id) {
        onAssetsSelected?.([result.asset]);
      }
    },
    [sdk, mode, onAssetsSelected]
  );

  const { filterOptions, initialFilters, filters, handleFiltersChange } = useSearchFilters({
    allowedAssetTypes,
    taxonomyDefinitions,
  });

  if (IS_DEV_MODE) {
    // eslint-disable-next-line no-console
    console.log('[AssetLibrary] useSearchFilters', {
      filterOptions,
      initialFilters,
      filters,
    });
  }

  const onFiltersChange = useCallback(
    (filters: Filter[]) => {
      handleFiltersChange(filters);

      // reset pagination
      setOffset(0);
    },
    [handleFiltersChange]
  );

  const onResetFilters = useCallback(
    () => onFiltersChange(initialFilters),
    [onFiltersChange, initialFilters]
  );

  const { value: searchResult, loading: isSearchLoading } = useAssetSearch({
    client,
    keyword,
    limit,
    offset,
    filters,
    sortBy,
    sortOrder,
  });

  const assets: SearchEntryPreview[] = useMemo(() => {
    if (!searchResult?.items?.length) {
      return [];
    }

    return searchResult.items?.map((entity) => mapEntityToPreview({ entity }));
  }, [searchResult]);

  const totalCount = searchResult?.totalItemCount ?? 0;

  const [assetId, setAssetId] = useState<string>();

  return (
    <VerticalRhythm>
      <AnimatePresence mode="wait">
        {assetId ? (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ ease: 'easeInOut', duration: 0.2 }}
          >
            <AssetPreviewWrapper
              mode={mode}
              assetId={assetId}
              onAssetSelect={(asset) => onAssetsSelected?.([asset])}
              onClose={() => setAssetId(undefined)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <VerticalRhythm
        gap="sm"
        style={{ marginTop: 'var(--spacing-sm)', display: assetId ? 'none' : undefined }}
      >
        <SearchAndFilter
          filters={filters}
          filterOptions={filterOptions}
          onChange={onFiltersChange}
          onSearchChange={handleKeywordChanged}
          onResetFilterValues={onResetFilters}
          totalResults={assets.length}
          // do not show 'no results' container while user is waiting for response
          resultsContainerView={isSearchLoading ? null : undefined}
          viewSwitchControls={
            <HorizontalRhythm gap="sm" justify="flex-end" align="center">
              <LogoutButton
                isAuthenticated={status === 'authenticated'}
                email={email}
                authRefresh={authRefresh}
              />
            </HorizontalRhythm>
          }
          additionalFiltersContainer={
            <HorizontalRhythm gap="sm" justify="flex-start" align="center">
              <InputSelect
                name="sortBy"
                label="Sort by"
                defaultOption="Relevance"
                options={SORT_BY_OPTIONS}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value ?? '')}
              />
              <InputSelect
                name="sortOrder"
                label="Sort order"
                options={SORT_ORDER_OPTIONS}
                value={sortOrder}
                onChange={(e) => setSortOrder((e.target.value as 'asc' | 'desc') ?? 'asc')}
                disabled={!sortBy}
              />
            </HorizontalRhythm>
          }
        />

        <AssetCardGrid
          itemsPerRow={4}
          isLoading={isSearchLoading}
          isEmpty={!isSearchLoading && !assets.length}
        >
          {assets.map((asset) => (
            <AssetMediaCard
              key={asset.id}
              title={asset.name}
              url={asset.thumbnailUrl}
              onClick={mode === 'parameter' ? () => setAssetId(asset.id) : () => handleOpenPreview(asset)}
            >
              <AssetFileProperties asset={asset} />
            </AssetMediaCard>
          ))}
        </AssetCardGrid>
        <HorizontalRhythm justify="center">
          <Pagination limit={limit} offset={offset} total={totalCount} onPageChange={handlePageChange} />
        </HorizontalRhythm>
      </VerticalRhythm>
    </VerticalRhythm>
  );
};
