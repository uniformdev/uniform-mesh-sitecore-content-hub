import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, useMeshLocation } from '@uniformdev/mesh-sdk-react';
import {
  Caption,
  Chip,
  DismissibleChipAction,
  FieldMessage,
  HorizontalRhythm,
  Icon,
  Label,
  toast,
  ToastContainer,
  Tooltip,
  VerticalRhythm,
} from '@uniformdev/design-system';

import { IntegrationSettingsValidated, WELL_KNOWN_DEFINITION_NAME, integrationSettingsSchema } from '@lib';
import { useIsValidAccountUrl } from '@hooks';

type Settings = IntegrationSettingsValidated;

export default function SettingsPage() {
  const { value, setValue } = useMeshLocation<'settings', Settings>();

  const {
    control,
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
    setValue: setFormValue,
  } = useForm<Settings>({
    resolver: zodResolver(integrationSettingsSchema),
    mode: 'onSubmit',
    defaultValues: {
      apiHost: value.apiHost ?? '',
      culture: value.culture ?? '',
      taxonomyNames: value.taxonomyNames ?? [WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA],
    } satisfies Settings,
  });

  const apiHost = useWatch<Settings, 'apiHost'>({ control, name: 'apiHost' });
  const isValidAccountUrl = useIsValidAccountUrl(apiHost);

  const taxonomyNames = useWatch<Settings, 'taxonomyNames'>({ control, name: 'taxonomyNames' });

  const handleSave = async (newSettings: Settings) => {
    try {
      const newValue = cleanupSettings(newSettings);

      await setValue(() => ({ newValue }));
      toast.success('Settings have been saved');
    } catch (error) {
      toast.error('Could not save settings');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSave)}>
      <VerticalRhythm gap="base" style={{ margin: 'var(--spacing-xs)' }}>
        <ToastContainer autoCloseDelay="normal" limit={5} />
        <VerticalRhythm className="full-width-caption">
          <Input
            {...register('apiHost')}
            label="Account URL"
            placeholder="https://company.sitecorecontenthub.cloud"
            icon={<AccountUrlIcon isValidAccountUrl={isValidAccountUrl} />}
            errorMessage={errors.apiHost?.message}
          />
          <Input
            {...register('culture')}
            label="Culture"
            caption="Culture is required to build edit URLs and resolve display names."
            placeholder="en-US"
            errorMessage={errors.culture?.message}
          />
          <TaxonomyDefinitions
            value={taxonomyNames}
            onUpdate={(newValues) => setFormValue('taxonomyNames', newValues)}
            error={errors.taxonomyNames?.message}
          />
          <Button type="submit" buttonType="secondary" onClick={() => trigger()} disabled={isSubmitting}>
            Save
          </Button>
        </VerticalRhythm>
      </VerticalRhythm>
    </form>
  );
}

const TaxonomyDefinitions = ({
  value,
  onUpdate,
  error,
}: {
  value: string[];
  onUpdate: (value: string[]) => void;
  error?: string;
}) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input) {
      return;
    }

    const newValues = input.split(',').map((x) => x.trim());
    const uniqueValues = Array.from(new Set([...value, ...newValues]));

    onUpdate(uniqueValues);
    setInput('');
  };

  const handleRemove = (preset: string) => {
    onUpdate(value.filter((x) => x !== preset));
  };

  return (
    <VerticalRhythm gap="sm" className="full-width-caption">
      <VerticalRhythm gap="0">
        <Label>Taxonomy Definitions</Label>
        <Caption>Type taxonomy definition names to be used as filters in the search UI.</Caption>
      </VerticalRhythm>
      <HorizontalRhythm gap="sm" css={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-sm)' }}>
        {value.map((singleValue) => (
          <Chip
            key={singleValue}
            theme="neutral-light"
            size="sm"
            variant="solid"
            text={singleValue}
            chipAction={
              // Required taxonomy definition is always included
              singleValue !== WELL_KNOWN_DEFINITION_NAME.ASSET_MEDIA ? (
                <DismissibleChipAction onDismiss={() => handleRemove(singleValue)} />
              ) : undefined
            }
            className="xs-chip"
          />
        ))}
      </HorizontalRhythm>
      <HorizontalRhythm gap="sm" justify="flex-start" align="center">
        <Input
          showLabel={false}
          onChange={(e) => setInput(e.target.value ?? '')}
          value={input}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
              // avoid form submission
              e.preventDefault();
            }
          }}
          style={{
            maxHeight: '40px',
            minHeight: 'unset',
          }}
        />
        <Button buttonType="secondaryInvert" onClick={handleAdd}>
          Add
        </Button>
      </HorizontalRhythm>
      <FieldMessage errorMessage={error} />
    </VerticalRhythm>
  );
};

const cleanupSettings = (settings: Settings): Settings => {
  let accountUrl = settings.apiHost.trim();
  if (accountUrl.endsWith('/')) {
    accountUrl = accountUrl.slice(0, -1);
  }

  return {
    apiHost: accountUrl,
    culture: settings.culture,
    taxonomyNames: settings.taxonomyNames,
  } satisfies Settings;
};

const AccountUrlIcon = ({ isValidAccountUrl }: { isValidAccountUrl: boolean | undefined }) => {
  if (isValidAccountUrl === undefined) {
    return undefined;
  }

  return isValidAccountUrl ? <SuccessIcon /> : <CautionIcon />;
};

const SuccessIcon = () => (
  <span css={{ color: 'var(--utility-success-icon)' }}>
    <Icon icon="check-o" iconColor="currentColor" size="1.25rem" />
  </span>
);

const CautionIcon = () => (
  <Tooltip title="Please check the account URL" placement="bottom">
    <span css={{ color: 'var(--utility-caution-icon)' }}>
      <Icon icon="warning" iconColor="currentColor" size="1.25rem" />
    </span>
  </Tooltip>
);
