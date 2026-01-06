import { v4 } from 'uuid';
import slugify from '@sindresorhus/slugify';

import {
  Asset,
  IntegrationSettings,
  SearchEntryPreview,
  Entity,
  FileProperties,
  TaxonomyOption,
  EntityDefinition,
} from '@lib';

import { AssetDefinitionType, AssetParamValueItem } from '@uniformdev/assets';
import { integrationSettingsSchema } from './types';

export const validateSettings = (settings: IntegrationSettings | null | undefined): boolean => {
  return integrationSettingsSchema.safeParse(settings).success;
};

const ensureString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const ensureObj = <T extends Record<string, unknown>>(value: unknown): T | null =>
  value !== null && typeof value === 'object' ? (value as T) : null;

export const mapEntityToPreview = ({ entity }: { entity: Entity }): SearchEntryPreview => {
  const name = getStringProperty(entity, 'Title') || 'Untitled';

  const fileProperties: FileProperties = ensureObj(entity.properties['FileProperties']) ?? {
    properties: {},
  };

  const mimeType = fileProperties.properties.content_type ?? '';

  const thumbnailUrl = entity.renditions?.thumbnail?.at(0)?.href ?? '';

  return {
    id: String(entity.id),
    name,
    mimeType,
    thumbnailUrl,
  };
};

export const mapEntityToAsset = ({
  entity,
  apiHost,
  culture,
}: {
  entity: Entity;
  apiHost: string | null | undefined;
  culture: string | null | undefined;
}): Asset => {
  const name = getStringProperty(entity, 'Title') || 'Untitled';
  const description = getStringProperty(entity, 'Description', culture);
  const altText = getStringProperty(entity, 'SC.Asset.AltText') || '';
  const approvedBy = getStringProperty(entity, 'ApprovedBy') || '';

  const approvalDateStr = getStringProperty(entity, 'ApprovalDate') || '';
  const approvalDate = approvalDateStr ? new Date(approvalDateStr) : undefined;

  const createdOnStr = entity.created_on || '';
  const createdOn = createdOnStr ? new Date(createdOnStr) : undefined;
  const modifiedOnStr = entity.modified_on || '';
  const modifiedOn = modifiedOnStr ? new Date(modifiedOnStr) : undefined;

  const fileProperties: FileProperties['properties'] =
    ensureObj(entity.properties['FileProperties'])?.properties ?? {};

  const mimeType = fileProperties.content_type ?? '';

  const width = Number(fileProperties.width) > 0 ? Number(fileProperties.width) : undefined;
  const height = Number(fileProperties.height) > 0 ? Number(fileProperties.height) : undefined;
  const size = Number(fileProperties.filesizebytes) > 0 ? Number(fileProperties.filesizebytes) : undefined;

  const previewUrl = entity.renditions?.preview?.at(0)?.href ?? '';
  const originalUrl = entity.renditions?.downloadOriginal?.at(0)?.href ?? '';

  const editUrl =
    apiHost && typeof entity.id === 'number' && culture ? `${apiHost}/${culture}/asset/${entity.id}` : '';

  return {
    id: entity.id,
    type: resolveAssetType(mimeType),
    name,
    // Description is text field with HTML inside let's strip that
    description: description ? description.replace(/<[^>]*>/g, '') : '',
    altText,
    mimeType,
    width,
    height,
    size,
    createdOn: createdOn && !isNaN(createdOn.getTime()) ? createdOn : undefined,
    modifiedOn: modifiedOn && !isNaN(modifiedOn.getTime()) ? modifiedOn : undefined,
    approvedBy,
    approvalDate: approvalDate && !isNaN(approvalDate.getTime()) ? approvalDate : undefined,
    cultures: entity.cultures,
    editUrl,
    previewUrl,
    originalUrl,
    publicUrl: undefined,
  };
};

export const mapAssetToAssetParamValue = ({
  asset,
  sourceId,
}: {
  asset: Asset;
  sourceId: string;
}): AssetParamValueItem => {
  const type = resolveAssetType(asset.mimeType);

  const description = asset.altText || asset.description;

  return {
    type,
    _id: v4(),
    _source: sourceId,
    fields: {
      url: {
        type: 'text',
        value: asset.publicUrl ?? '',
      },
      id: {
        type: 'text',
        value: String(asset.id),
      },
      mediaType: asset?.mimeType
        ? {
            type: 'text',
            value: asset?.mimeType,
          }
        : undefined,
      title: {
        type: 'text',
        value: asset.name,
      },
      description: description
        ? {
            type: 'text',
            value: description,
          }
        : undefined,
      width: asset.width
        ? {
            type: 'number',
            value: asset.width,
          }
        : undefined,
      height: asset.height
        ? {
            type: 'number',
            value: asset.height,
          }
        : undefined,
      size: asset.size
        ? {
            type: 'number',
            value: asset.size,
          }
        : undefined,
    },
  };
};

export const tryMapEntityToTaxonomyOption = ({
  definition,
  entity,
  culture,
}: {
  definition: EntityDefinition;
  entity: Entity;
  culture: string;
}): TaxonomyOption | null => {
  if (!entity.is_root_taxonomy_item) {
    return null;
  }
  if (!entity.identifier) {
    return null;
  }
  const label = getTaxonomyOptionLabel(definition, entity, culture);
  if (!label) {
    return null;
  }

  return {
    id: entity.id,
    identifier: entity.identifier,
    name: label,
  };
};

const getTaxonomyOptionLabel = (definition: EntityDefinition, entity: Entity, culture: string): string => {
  if (!definition.display_template) {
    return '';
  }

  const label = definition.display_template.replace(/{([^}]+)}/g, (_, field) => {
    return getStringProperty(entity, field, culture) ?? '';
  });

  return label;
};

export const getStringProperty = (entity: Entity, field: string, culture?: string | null): string | null => {
  const rawValue = entity.properties[field];

  const asString = ensureString(rawValue);
  if (asString) {
    return asString;
  }

  if (!culture) {
    return null;
  }

  const asObj = ensureObj(rawValue);
  if (culture && asObj && typeof asObj[culture] === 'string') {
    return asObj[culture];
  }

  return null;
};

const resolveAssetType = (mimeType: string | null | undefined): AssetDefinitionType => {
  const fileFormat = mimeType?.split('/').at(0);
  if (!fileFormat) {
    return 'other';
  }

  switch (fileFormat) {
    case 'image':
      return 'image';
    case 'audio':
      return 'audio';
    case 'video':
      return 'video';
    default:
      return 'other';
  }
};

export const getReadableFileSize = (sizeInBytes: number | undefined | null): string => {
  if (!sizeInBytes) {
    return '';
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  }
  return `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
};

export const buildAssetRelativeUrl = (name: string): string => {
  const uniqueId = v4().replace(/-/g, '');
  let normalizedName = name.toLowerCase().trim();
  let extension = '';

  // let's do not slugify the extension and keep it as is
  const extensionIndex = normalizedName.lastIndexOf('.');
  if (extensionIndex > 0) {
    normalizedName = normalizedName.substring(0, extensionIndex);
    extension = name.substring(extensionIndex);
  }

  const slug = slugify(normalizedName);

  return `${uniqueId}_${slug}${extension}`;
};
