import {
  ImageProps,
  ImageBroken,
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  ObjectGridItemProps,
} from '@uniformdev/design-system';
import { useState } from 'react';

export interface AssetMediaCardProps extends Omit<ObjectGridItemProps, 'cover' | 'header'> {
  url?: string;
  coverImageProps?: Omit<ImageProps, 'src' | 'alt' | 'variant'>;
  onClick?: () => void;
}

export function AssetMediaCard(props: AssetMediaCardProps) {
  const { url, title, coverImageProps = {}, onClick, ...rest } = props;

  // fallback to skeleton image if image could not be loaded
  const [isBroken, setIsBroken] = useState(false);

  return (
    <ObjectGridItem
      header={<ObjectGridItemHeading heading={title} tooltip={title} />}
      title={title}
      onClick={onClick}
      onError={() => setIsBroken(true)}
      cover={
        url && !isBroken ? (
          <ObjectGridItemCoverButton
            title={title}
            id={url}
            imageUrl={url}
            onSelection={() => onClick?.()}
            {...coverImageProps}
          />
        ) : (
          <ImageBroken />
        )
      }
      {...rest}
    />
  );
}
