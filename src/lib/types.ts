import * as z from 'zod';
import { Session } from 'next-auth';
import { AssetDefinitionType } from '@uniformdev/assets';
import { RenditionKey } from '@lib';

export const integrationSettingsSchema = z.object({
  apiHost: z.url(),
  culture: z.string().min(1),
  taxonomyNames: z.array(z.string()),
});

// In UI components, we should handle the case when settings have not been defined at all
export const integrationSettingsSchemaRaw = integrationSettingsSchema.partial();

export type IntegrationSettings = z.infer<typeof integrationSettingsSchemaRaw>;
export type IntegrationSettingsValidated = z.infer<typeof integrationSettingsSchema>;

export type OAuthSession = Session & {
  tenant: string;
  accessToken: string;
};

// just in case we need to add more tenants
export type OAuthTenant = 'content-hub';

export type SelectOption = {
  label: string;
  value: string;
};

export type Asset = {
  id: number;
  type: AssetDefinitionType;
  name: string;
  description: string;
  altText?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  createdOn?: Date;
  modifiedOn?: Date;
  approvalDate?: Date;
  approvedBy?: string;
  cultures: string[];
  /**
   * Link to the Content Hub asset edit page.
   */
  editUrl: string;
  /**
   * Image preview URL for the asset. Content Hub provides preview for different media types.
   *
   * WARNING: This URL has expiration date, so it should be used only for preview purposes.
   */
  previewUrl: string;
  /**
   * Original asset file URL.
   *
   * WARNING: This URL has expiration date, so it should be used only for preview purposes.
   */
  originalUrl: string;
  /**
   * Stable URL to the original asset file.
   *
   * It will be resolved by asset preview component, since we may need user action to create a public link.
   *
   * This URL should be used as Uniform asset URL.
   */
  publicUrl?: string;
};

export type SearchEntryPreview = {
  id: string;
  name: string;
  mimeType?: string;
  thumbnailUrl?: string;
};

export type AssetPublicLink = {
  id: number;
  rendition: RenditionKey;
  publicUrl: string;
  status: 'Completed' | 'Pending' | 'unknown';
};

export type AssetMediaTaxonodyIdentifier =
  | 'M.AssetMedia.Archives'
  | 'M.AssetMedia.Audio'
  | 'M.AssetMedia.ColorProfiles'
  | 'M.AssetMedia.Default'
  | 'M.AssetMedia.Documents'
  | 'M.AssetMedia.Images'
  | 'M.AssetMedia.Indesign'
  | 'M.AssetMedia.Vectors'
  | 'M.AssetMedia.Videos'
  | 'M.AssetMedia.WebPages';

export type AssetPreviewDialog = {
  params: {
    mode: 'library' | 'parameter';
    id: string;
  };
  result: {
    asset?: Asset;
  };
};

export type ApiRequestPayload = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiUrl: string;
  token: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

export type AssetMetadataRequestPayload = {
  assetUrl: string;
};

export type AssetMetadataResponsePayload = {
  contentType: string;
  contentLength: number;
};

export type FetchStatusRequestPayload = {
  url: string;
};
