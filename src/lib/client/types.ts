export type PlainTextApiResult = {
  plainText: string;
};

export type RenditionKey = 'downloadOriginal' | 'preview' | 'thumbnail';

export type Entity = {
  id: number;
  identifier: string;
  cultures: string[];
  created_on?: string;
  modified_on?: string;
  properties: Record<string, unknown>;
  renditions?: Record<RenditionKey, Array<{ href: string } | undefined>>;
  is_root_taxonomy_item?: boolean;
  entitydefinition?: {
    href: string;
  };
  path?: Array<{
    values?: {
      [culture: string]: string;
    };
    entity?: string;
    definition?: string;
  }>;
};

export type EntityDefinition = {
  id: number;
  name: string;
  display_template: string;
  is_taxonomy_item_definition: boolean;
  labels: {
    [culture: string]: string;
  };
};

export type PublicLinkEntity = Entity & {
  public_link?: string;
};

export type FileProperties = {
  properties: {
    content_type?: string;
    extension?: string;
    filename?: string;
    width?: string;
    height?: string;
    filesize?: number;
    filesizebytes?: string;
  };
};

export type QueryV1ApiResult = {
  items: Entity[];
  total_items: number;
  returned_items: number;
  // next?: {
  //   href: string;
  // };
};

type QueryComparisonOperatorV3 =
  | 'Equals'
  | 'NotEquals'
  | 'Gt'
  | 'Lt'
  | 'Lte'
  | 'Gte'
  | 'Contains'
  | 'StartsWith'
  | 'EndsWith';

type QueryFilterV3 =
  | {
      type: 'Definition';
      id?: number;
      ids?: number[];
      name?: string;
      names?: string[];
      operator: QueryComparisonOperatorV3;
    }
  | {
      type: 'Id';
      id?: number;
      ids?: number[];
      operator: QueryComparisonOperatorV3;
    }
  | {
      type: 'Property';
      property: string;
      culture?: string;
      data_type:
        | 'None'
        | 'String'
        | 'Int'
        | 'Long'
        | 'Decimal'
        | 'Float'
        | 'DateTime'
        | 'DateTimeOffset'
        | 'Bool';
      value?: unknown;
      values?: unknown[];
      operator: QueryComparisonOperatorV3;
    }
  | {
      type: 'Relation';
      relation: string;
      parent_id?: number;
      parent_ids?: number[];
    }
  | {
      type: 'Not';
      child: QueryFilterV3;
    }
  | {
      type: 'Composite';
      operator: 'And' | 'Or';
      children: QueryFilterV3[];
    };

type QueryV3LoadConfiguration = {
  load_entities?: boolean;
  culture_option?: {
    load_option?: 'All' | 'Default' | 'None' | 'Custom';
    cultures?: string[];
  };
  property_option?: {
    load_option?: 'All' | 'Default' | 'None' | 'Custom';
    properties?: string[];
  };
  relation_option?: {
    load_option: 'All' | 'Default' | 'None' | 'Custom';
    relations?: Array<{
      name: string;
      role?: 'Parent' | 'Child';
    }>;
    max_related_items?: number;
  };
};

export type QueryV3RequestBody = {
  query: {
    filter?: QueryFilterV3;
    skip?: number;
    take?: number;
    sorting?: Array<{
      field_type: 'Property' | 'System';
      field: string;
      culture?: string;
      order: 'Asc' | 'Desc';
    }>;
  };
  load_configuration?: QueryV3LoadConfiguration;
};

export type QueryV3ApiResult = {
  items: Array<{
    entity: Entity;
    link: {
      href: string;
    };
  }>;
  total_items: number;
  returned_items: number;
};

export type SearchV3RequestBody = {
  skip?: number;
  take?: number;
  fields?: string[];
  fulltext?: string[];
  filters?: Array<{
    definition: string;
    type: 'FieldFilter' | 'InFilter' | 'DynamicFilter' | 'Nested' | 'IdFilter' | 'SelectionPoolFilter';
    name: string;
    operator:
      | 'None'
      | 'Equals'
      | 'LessThan'
      | 'GreaterThan'
      | 'Between'
      | 'StartsWith'
      | 'EndsWith'
      | 'Contains'
      | 'FacetEquals'
      | 'DoesNotContain'
      | 'DoesNotStartWith'
      | 'DoesNotEndWith'
      | 'LessThanOrEquals'
      | 'GreaterThanOrEquals'
      | 'DoesNotEqual'
      | 'AnyOf'
      | 'AllOf'
      | 'NoneOf'
      | 'Missing'
      | 'Exists'
      | 'Changed';
    values: string[];
    multiSelect?: boolean;
  }>;
  sorting?: {
    field: string;
    asc: boolean;
  };
};

export type SearchV3ApiResult = {
  items: Entity[];
  returnedItemCount: number;
  totalItemCount: number;
  skip: number;
  take: number;
};

export type EntityDefinitionV1ApiResult = EntityDefinition;

export type EntityDefinitionsV1ApiResult = {
  items: EntityDefinition[];
  total_items: number;
  returned_items: number;
};

export type SingleEntityV2ApiResult = Entity;

export type UpsertEntityV2RequestBody = {
  /**
   * Negative number for new entity, positive number for existing one
   */
  id: number;
  entitydefinition: {
    href: string;
  };
  cultures?: string[];
  properties?: Record<string, unknown>;
  relations?: Record<
    string,
    {
      self: {
        href: string;
      };
      parents?: Array<{
        href: string;
      }>;
      children?: Array<{
        href: string;
      }>;
      inheritsSecurity?: boolean;
    }
  >;
};

export type UpsertEntityV2ApiResult = {
  id: number;
  identifier: string;
};

export type TaxonomyOption = {
  id: number;
  identifier: string;
  name: string;
};

export type TaxonomyDefinition = {
  id: number;
  name: string;
  label: string;
  facetKey: string;
  options: TaxonomyOption[];
};
