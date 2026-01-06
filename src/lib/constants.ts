export const TRUE_VALIDATION_RESULT = Object.freeze({ isValid: true });

export const DEFAULT_SEARCH_LIMIT = 40;

export const IS_DEV_MODE = process.env.NODE_ENV === 'development';

export const WELL_KNOWN_DEFINITION_NAME = {
  ASSET: 'M.Asset',
  ASSET_MEDIA: 'M.AssetMedia',
  PUBLIC_LINK: 'M.PublicLink',
} as const;
