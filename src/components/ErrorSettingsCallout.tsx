import React from 'react';
import { Callout } from '@uniformdev/mesh-sdk-react';

const ErrorSettingsCallout = () => (
  <Callout type="error">
    It appears the integration is not configured. Please visit the &quot;Settings &gt; Integrations &gt;
    Sitecore Content Hub&quot; (header navigation) page.
  </Callout>
);

export default ErrorSettingsCallout;
