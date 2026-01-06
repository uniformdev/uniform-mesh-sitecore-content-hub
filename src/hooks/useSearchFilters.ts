import { useCallback, useMemo, useState } from 'react';

import { Filter, FilterOption, FilterOptionGroup } from '@uniformdev/mesh-sdk-react';
import {
  AssetMediaTaxonodyIdentifier,
  TaxonomyDefinition,
  TaxonomyOption,
  WELL_KNOWN_DEFINITION_NAME,
} from '@lib';
import { AssetDefinitionType } from '@uniformdev/assets';

const FILTER_GROUPS = {
  SYSTEM: {
    label: 'System',
    value: 'system',
  },
  FILTERS: {
    label: 'Filters',
    value: 'filters',
  },
} as const;

type FilterEx = Filter & { required?: boolean };

export const useSearchFilters = ({
  allowedAssetTypes,
  taxonomyDefinitions,
}: {
  allowedAssetTypes: AssetDefinitionType[] | undefined;
  taxonomyDefinitions: TaxonomyDefinition[];
}): {
  filterOptions: FilterOptionGroup[];
  initialFilters: Filter[];
  filters: Filter[];
  handleFiltersChange: (newFilters: Filter[]) => void;
} => {
  const mediaTypesTaxonomy = useMemo(
    () => getMediaTypesTaxonomy(allowedAssetTypes, taxonomyDefinitions),
    [allowedAssetTypes, taxonomyDefinitions]
  );

  const hasAssetTypeRestrictions = !!allowedAssetTypes?.length;

  const initialFilters = useMemo(() => {
    const filters: FilterEx[] = [];

    if (mediaTypesTaxonomy && mediaTypesTaxonomy.options.length) {
      filters.push({
        field: mediaTypesTaxonomy.facetKey,
        operator: 'in',
        value: hasAssetTypeRestrictions ? mediaTypesTaxonomy.options.map((x) => String(x.id)) : '',
        required: hasAssetTypeRestrictions,
      });
    }

    // add empty filter if no filters are present for better looking UI
    if (filters.length === 0) {
      filters.push({
        field: '',
        operator: '',
        value: '',
      });
    }

    return filters;
  }, [mediaTypesTaxonomy, hasAssetTypeRestrictions]);

  const [filters, setFilters] = useState<FilterEx[]>(initialFilters);
  const activeFilterKeys = useMemo(() => filters.map((x) => x.field), [filters]);

  const filterOptions = useMemo(() => {
    const filterGroups: FilterOptionGroup[] = [
      {
        ...FILTER_GROUPS.SYSTEM,
        options: [
          getAssetMediaTypeOptions({
            mediaTypesTaxonomy,
            hasAssetTypeRestrictions,
            activeFilterKeys,
          }),
        ].filter((x) => !!x),
      },
      {
        ...FILTER_GROUPS.FILTERS,
        options: taxonomyDefinitions
          .filter((definition) => definition.name !== WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA)
          .map((taxonomyDefinition) => getFacetOptions({ taxonomyDefinition, activeFilterKeys }))
          .filter((x) => !!x),
      },
    ];

    return filterGroups;
  }, [mediaTypesTaxonomy, taxonomyDefinitions, hasAssetTypeRestrictions, activeFilterKeys]);

  const handleFiltersChange = useCallback(
    (filters: Filter[]) => {
      const newFilters = prepareFilters(initialFilters, filters);

      setFilters(newFilters);
    },
    [initialFilters]
  );

  return {
    filterOptions,
    initialFilters,
    filters,
    handleFiltersChange,
  };
};

const prepareFilters = (initialFilters: FilterEx[], newFilters: FilterEx[]): FilterEx[] => {
  // - collect required filters from initial
  // - prevent mutation of existing objects
  const resultFilters = initialFilters.filter((f) => f.field && f.required).map((filter) => ({ ...filter }));

  // mix with new filters, but keep required filters in place
  newFilters.forEach((newFilter) => {
    const existing = resultFilters.find((f) => f.field === newFilter.field);
    if (!existing) {
      resultFilters.push(newFilter);
      return;
    }

    // avoid overriding required value with empty value
    const hasNewValue = Array.isArray(newFilter.value) ? !!newFilter.value.length : newFilter.value;
    if (hasNewValue) {
      existing.operator = newFilter.operator;
      existing.value = newFilter.value;
    }
  });

  return resultFilters;
};

const getAssetMediaTypeOptions = ({
  mediaTypesTaxonomy,
  hasAssetTypeRestrictions,
  activeFilterKeys,
}: {
  mediaTypesTaxonomy: TaxonomyDefinition | null;
  hasAssetTypeRestrictions: boolean;
  activeFilterKeys: string[];
}): FilterOption | null => {
  if (!mediaTypesTaxonomy?.options.length) {
    return null;
  }

  return {
    label: hasAssetTypeRestrictions ? 'Media Type (Required)' : 'Media Type',
    value: mediaTypesTaxonomy.facetKey,
    valueOptions: mediaTypesTaxonomy.options.map((option) => ({
      label: option.name,
      value: String(option.id),
    })),
    operatorOptions: [
      {
        label: 'is',
        value: 'eq',
        editorType: 'singleChoice',
        expectedValueType: 'single',
      },
      {
        label: 'is any of...',
        value: 'in',
        editorType: 'multiChoice',
        expectedValueType: 'array',
      },
    ],
    // make the filter read-only if there is only one allowed option and it is required
    readOnly: hasAssetTypeRestrictions && mediaTypesTaxonomy.options.length === 1,
    // do not allow to select the same filter twice
    disabled: activeFilterKeys.includes(mediaTypesTaxonomy.facetKey),
  };
};

const getFacetOptions = ({
  taxonomyDefinition,
  activeFilterKeys,
}: {
  taxonomyDefinition: TaxonomyDefinition;
  activeFilterKeys: string[];
}): FilterOption | null => {
  if (!taxonomyDefinition.options.length) {
    return null;
  }

  const filterKey = taxonomyDefinition.facetKey;

  return {
    label: taxonomyDefinition.label,
    value: filterKey,
    valueOptions: taxonomyDefinition.options.map((option) => ({
      label: option.name,
      value: String(option.id),
    })),
    operatorOptions: [
      {
        label: 'is',
        value: 'eq',
        editorType: 'singleChoice',
        expectedValueType: 'single',
      },
      {
        label: 'is any of...',
        value: 'in',
        editorType: 'multiChoice',
        expectedValueType: 'array',
      },
    ],
    // do not allow to select the same filter twice
    disabled: activeFilterKeys.includes(filterKey),
  };
};

const getMediaTypesTaxonomy = (
  allowedAssetTypes: AssetDefinitionType[] | null | undefined,
  taxonomyDefinitions: TaxonomyDefinition[]
): TaxonomyDefinition | null => {
  const mediaTypeTaxonomy = taxonomyDefinitions.find(
    (def) => def.name === WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA
  );

  if (!mediaTypeTaxonomy) {
    return null;
  }

  if (!allowedAssetTypes?.length) {
    return {
      ...mediaTypeTaxonomy,
      options: sortMediaTypes(mediaTypeTaxonomy.options),
    };
  }

  return {
    ...mediaTypeTaxonomy,
    options: sortMediaTypes(
      mediaTypeTaxonomy.options.filter((taxonomy) =>
        isAllowedAssetMediaType(allowedAssetTypes, taxonomy.identifier as AssetMediaTaxonodyIdentifier)
      )
    ),
  };
};

const isAllowedAssetMediaType = (
  allowedAssetTypes: AssetDefinitionType[] | null | undefined,
  identifier: AssetMediaTaxonodyIdentifier
): boolean => {
  if (!allowedAssetTypes?.length) {
    return true;
  }

  if (!identifier) {
    return false;
  }

  switch (identifier) {
    case 'M.AssetMedia.Images':
      return allowedAssetTypes.includes('image');
    case 'M.AssetMedia.Vectors':
      return allowedAssetTypes.includes('image');
    case 'M.AssetMedia.Audio':
      return allowedAssetTypes.includes('audio');
    case 'M.AssetMedia.Videos':
      return allowedAssetTypes.includes('video');
    default:
      return allowedAssetTypes.includes('other');
  }
};

const MEDIA_TYPE_ORDER: string[] = [
  'M.AssetMedia.Images',
  'M.AssetMedia.Videos',
  'M.AssetMedia.Audio',
  'M.AssetMedia.Documents',
  'M.AssetMedia.Vectors',
  'M.AssetMedia.Archives',
] satisfies AssetMediaTaxonodyIdentifier[];

const sortMediaTypes = (options: TaxonomyOption[]): TaxonomyOption[] => {
  return [...options].sort((a, b) => {
    const indexA = MEDIA_TYPE_ORDER.indexOf(a.identifier);
    const indexB = MEDIA_TYPE_ORDER.indexOf(b.identifier);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.identifier.localeCompare(b.identifier);
  });
};
