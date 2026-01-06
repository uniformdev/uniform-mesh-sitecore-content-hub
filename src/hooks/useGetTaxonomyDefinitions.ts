import { useAsync } from 'react-use';

import { ContentHubClient, TaxonomyDefinition } from '@lib';
import { useDeepCompareMemoize, useIntegrationSettings } from '@hooks';

export const useGetTaxonomyDefinitions = ({
  client,
  definitionNames,
}: {
  client: ContentHubClient | null | undefined;
  definitionNames: string[];
}): ReturnType<typeof useAsync<() => Promise<TaxonomyDefinition[]>>> => {
  const settings = useIntegrationSettings(true);
  const memoizedDefinitionNames = useDeepCompareMemoize(definitionNames);

  return useAsync(async () => {
    if (!client || !settings.culture || !memoizedDefinitionNames.length) {
      return [];
    }

    return await client.getTaxonomyDefinitions({
      definitionNames: memoizedDefinitionNames,
      culture: settings.culture,
    });
  }, [client, settings.culture, memoizedDefinitionNames]);
};
