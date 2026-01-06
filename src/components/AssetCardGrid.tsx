import { PropsWithChildren, ReactNode } from 'react';

import { ObjectGridContainer, Skeleton } from '@uniformdev/design-system';

export type AssetGridProps = PropsWithChildren<{
  itemsPerRow?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
}>;

export const AssetCardGrid = ({
  isLoading,
  itemsPerRow = 3,
  isEmpty,
  emptyState,
  children,
}: AssetGridProps) => {
  return !isLoading && isEmpty ? (
    emptyState
  ) : (
    <ObjectGridContainer gridCount={itemsPerRow}>
      {isLoading
        ? Array.from({ length: itemsPerRow * 2 }).map((_, i) => (
            <Skeleton key={i} style={{ aspectRatio: '4/3' }} height="unset" width="unset" />
          ))
        : children}
    </ObjectGridContainer>
  );
};
