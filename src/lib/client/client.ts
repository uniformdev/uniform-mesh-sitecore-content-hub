import { Filter } from '@uniformdev/mesh-sdk-react';

import { ApiFetcher, createCorsFetcher } from './fetcher';
import {
  UpsertEntityV2ApiResult,
  UpsertEntityV2RequestBody,
  QueryV1ApiResult,
  EntityDefinitionV1ApiResult,
  RenditionKey,
  SearchV3ApiResult,
  SearchV3RequestBody,
  SingleEntityV2ApiResult,
  TaxonomyDefinition,
  QueryV3ApiResult,
  QueryV3RequestBody,
  Entity,
  EntityDefinitionsV1ApiResult,
} from './types';
import { tryMapEntityToTaxonomyOption, WELL_KNOWN_DEFINITION_NAME } from '@lib';

export type ContentHubClientOptions = {
  apiHost: string;
  accessToken: string;
  rateLimit?: number;
};

export class ContentHubClient {
  fetcher: ApiFetcher;

  constructor({ apiHost, accessToken }: ContentHubClientOptions) {
    this.fetcher = createCorsFetcher({ apiHost, token: accessToken });
  }

  public async getEntityDefinition({
    definitionName,
  }: {
    definitionName: string;
  }): Promise<EntityDefinitionV1ApiResult | null> {
    if (!definitionName) {
      return null;
    }

    const json = await this.fetcher<EntityDefinitionV1ApiResult>({
      method: 'GET',
      apiUrl: `/api/entitydefinitions/${definitionName}`,
    });

    return typeof json?.id === 'number' ? json : null;
  }

  public async getEntityDefinitions({
    definitionNames,
  }: {
    definitionNames: string[];
  }): Promise<EntityDefinitionsV1ApiResult | null> {
    if (!definitionNames?.length) {
      return null;
    }

    const safeNames = definitionNames.filter((name) => !!name).join(',');

    const json = await this.fetcher<EntityDefinitionsV1ApiResult>({
      method: 'GET',
      apiUrl: `/api/entitydefinitions?definitionsToLoadByName=${safeNames}`,
    });

    return Array.isArray(json?.items) ? json : null;
  }

  public async getQueryV1({
    query,
    members,
    limit,
    offset,
  }: {
    query: string;
    members?: string[];
    limit?: number;
    offset?: number;
  }): Promise<QueryV1ApiResult | null> {
    const apiUrl: URL = new URL(`/api/entities/query`, 'https://none.com');

    apiUrl.searchParams.set('query', query);
    if (members?.length) {
      apiUrl.searchParams.set('members', members.join(','));
    }
    if (limit) {
      apiUrl.searchParams.set('take', String(limit));
    }
    if (offset) {
      apiUrl.searchParams.set('skip', String(offset));
    }

    const json = await this.fetcher<QueryV1ApiResult>({
      method: 'GET',
      apiUrl: apiUrl.pathname + apiUrl.search,
      headers: {
        Accept: 'application/json',
        'X-ApiVersion': '1',
      },
    });

    return Array.isArray(json?.items) ? json : null;
  }
  public async *getQueryV1AllEntities({
    query,
    members,
  }: {
    query: string;
    members?: string[];
  }): AsyncGenerator<Entity> {
    // guard for infinite loop
    const MAX_OFFSET = 5000;

    try {
      // max Content Hub page size
      const LIMIT = 100;
      let offset = 0;

      while (offset < MAX_OFFSET) {
        const page = await this.getQueryV1({
          query,
          members,
          limit: LIMIT,
          offset,
        });

        if (!page || !Array.isArray(page?.items)) {
          return;
        }

        for (const item of page.items) {
          yield item;
        }

        // amount of items on the page is less than the limit, we've reached the end
        if (page.items.length < 100) {
          return;
        }

        offset += LIMIT;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  public async getEntity({ id }: { id: string }): Promise<SingleEntityV2ApiResult | null> {
    if (!id) {
      return null;
    }

    const entity = await this.fetcher<SingleEntityV2ApiResult>({
      method: 'GET',
      apiUrl: `/api/entities/${id}`,
      headers: {
        Accept: 'application/json',
        // enforce specific version, otherwise Content Hub may use older version specs
        'X-ApiVersion': '2',
      },
    });

    return typeof entity?.id === 'number' ? entity : null;
  }

  public async upsertEntityV2(body: UpsertEntityV2RequestBody): Promise<UpsertEntityV2ApiResult | null> {
    const apiResult = await this.fetcher<UpsertEntityV2ApiResult>({
      method: 'POST',
      apiUrl: `/api/entities`,
      headers: {
        Accept: 'application/json',
        // enforce specific version, otherwise Content Hub may use older version specs
        'X-ApiVersion': '2',
      },
      body,
    });

    return typeof apiResult?.id === 'number' ? apiResult : null;
  }

  public async getTaxonomyDefinitions({
    definitionNames,
    culture,
  }: {
    definitionNames: string[];
    culture: string;
  }): Promise<TaxonomyDefinition[]> {
    if (!definitionNames?.length) {
      return [];
    }

    // ensure we have the definition in the Content Hub
    const entityDefinitions = await this.getEntityDefinitions({
      definitionNames: [...new Set(definitionNames)],
    });

    const taxonomyDefinitions =
      entityDefinitions?.items?.filter((def) => def.id && def.name && def.is_taxonomy_item_definition) ?? [];

    if (!taxonomyDefinitions.length) {
      return [];
    }

    const allEntities = await Array.fromAsync(
      this.getQueryV1AllEntities({
        query: `(${taxonomyDefinitions.map((def) => `Definition.Name=='${def.name}'`).join(' OR ')}) AND IsRootTaxonomyItem`,
        // taxonomy definitions may use different property names as display title, let's fetch all properties
        // members: ['TaxonomyName', 'TaxonomyLabel', 'ClassificationName'],
      })
    );

    return taxonomyDefinitions
      .map<TaxonomyDefinition | null>((definition) => {
        const options = allEntities
          ?.filter((entity) =>
            entity.entitydefinition?.href?.endsWith(`/entitydefinitions/${definition.name}`)
          )
          .map((entity) => tryMapEntityToTaxonomyOption({ definition, entity, culture }))
          .filter((x) => !!x);

        if (!options?.length) {
          return null;
        }

        const label = culture && definition.labels[culture] ? definition.labels[culture] : definition.name;

        return {
          id: definition.id,
          name: definition.name,
          label,
          // Content Hub uses this format of facet key in Search API
          facetKey: `taxonomy_items.${definition.id}.*`,
          options: options.sort((a, b) => a.name.localeCompare(b.name)),
        };
      })
      .filter((x) => !!x)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  public async searchAssets({
    keyword,
    filters,
    limit,
    offset,
    sortBy,
    sortOrder,
  }: {
    keyword?: string;
    filters: Filter[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SearchV3ApiResult | null> {
    const body: SearchV3RequestBody = {
      skip: offset,
      take: limit,
      fields: ['Title', 'FileProperties'],
      filters: [],
      fulltext: keyword ? [keyword] : undefined,
      sorting: sortBy
        ? {
            field: sortBy,
            asc: sortOrder === 'asc',
          }
        : undefined,
    };

    if (filters?.length) {
      filters
        .filter((x) => x.field && x.operator && (Array.isArray(x.value) ? x.value.length : !!x.value))
        .forEach((filter) => {
          body.filters?.push({
            definition: WELL_KNOWN_DEFINITION_NAME.ASSET,
            name: filter.field,
            type: 'InFilter',
            operator: 'AnyOf',
            values: Array.isArray(filter.value) ? filter.value : [filter.value],
          });
        });
    }

    const json = await this.fetcher<SearchV3ApiResult>({
      method: 'POST',
      apiUrl: '/api/search',
      headers: {
        Accept: 'application/json',
        // enforce specific version, otherwise Content Hub may use older version specs
        'X-ApiVersion': '3',
      },
      body,
    });

    return Array.isArray(json?.items) ? json : null;
  }

  public async getChildRelations({
    parentId,
    relation,
  }: {
    parentId: number;
    relation: string;
  }): Promise<QueryV3ApiResult | null> {
    if (!parentId || !relation) {
      return null;
    }

    const body: QueryV3RequestBody = {
      query: {
        filter: {
          type: 'Relation',
          relation,
          parent_id: parentId,
        },
        sorting: [
          {
            field_type: 'System',
            field: 'ModifiedOn',
            order: 'Desc',
          },
        ],
      },
      load_configuration: {
        property_option: {
          load_option: 'All',
        },
        relation_option: {
          load_option: 'Custom',
          relations: [{ name: relation }],
        },
      },
    };

    const apiResult = await this.fetcher<QueryV3ApiResult>({
      method: 'POST',
      apiUrl: `/api/entities/query`,
      headers: {
        Accept: 'application/json',
        // enforce specific version, otherwise Content Hub may use older version specs
        'X-ApiVersion': '3',
      },
      body,
    });

    return Array.isArray(apiResult?.items) ? apiResult : null;
  }

  public async createAssetPublicLink({
    apiHost,
    assetId,
    cultures,
    rendition,
    relativeUrl,
  }: {
    apiHost: string | null | undefined;
    assetId: number;
    cultures: string[];
    rendition: RenditionKey;
    relativeUrl: string;
  }): Promise<UpsertEntityV2ApiResult | null> {
    if (!apiHost || !assetId || !cultures || !rendition) {
      return null;
    }

    // negative number to create a new public link
    const publicLinkId = -1;

    const body: UpsertEntityV2RequestBody = {
      id: publicLinkId,
      // cultures,
      entitydefinition: {
        href: `${apiHost}/api/entitydefinitions/${WELL_KNOWN_DEFINITION_NAME.PUBLIC_LINK}`,
      },
      relations: {
        // FileToPublicLink: {
        //   self: {
        //     href: `${apiHost}/api/entities/${publicLinkId}/relations/FileToPublicLink`,
        //   },
        //   inheritsSecurity: true,
        // },
        AssetToPublicLink: {
          inheritsSecurity: true,
          parents: [
            {
              href: `${apiHost}/api/entities/${assetId}`,
            },
          ],
          self: {
            href: `${apiHost}/api/entities/${publicLinkId}/relations/AssetToPublicLink`,
          },
        },
        // PublicLinkToWhereUsed: {
        //   self: {
        //     href: `${apiHost}/api/entities/${publicLinkId}/relations/PublicLinkToWhereUsed`,
        //   },
        // },
        // PublicLinkToUsage: {
        //   self: {
        //     href: `${apiHost}/api/entities/${publicLinkId}/relations/PublicLinkToUsage`,
        //   },
        // },
      },
      properties: {
        RelativeUrl: relativeUrl,
        Resource: rendition,
      },
    };

    const apiResult = await this.fetcher<UpsertEntityV2ApiResult>({
      method: 'POST',
      apiUrl: `/api/entities`,
      headers: {
        Accept: 'application/json',
        // enforce V2, otherwise Content Hub may use older version specs
        'X-ApiVersion': '2',
      },
      body,
    });

    return typeof apiResult?.id === 'number' ? apiResult : null;
  }
}
