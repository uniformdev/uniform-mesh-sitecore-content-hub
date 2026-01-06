import { useAsync } from 'react-use';
import { Filter } from '@uniformdev/mesh-sdk-react';

import { ContentHubClient, SearchV3ApiResult } from '@lib';
import { useDeepCompareMemoize } from '@hooks';

export const useAssetSearch = ({
  client,
  keyword,
  filters,
  limit,
  offset,
  sortBy,
  sortOrder = 'asc',
}: {
  client: ContentHubClient | null | undefined;
  keyword?: string;
  filters: Filter[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): ReturnType<typeof useAsync<() => Promise<SearchV3ApiResult | null>>> => {
  const memoizedFilters = useDeepCompareMemoize(filters.filter((x) => x.field && x.operator && x.value));

  return useAsync(async () => {
    if (!client) {
      return null;
    }

    return await client.searchAssets({
      keyword,
      filters: memoizedFilters,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
  }, [client, keyword, memoizedFilters, limit, offset, sortBy, sortOrder]);
};
