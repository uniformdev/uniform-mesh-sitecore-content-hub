# Uniform Sitecore Content Hub

Sitecore Content Hub integration for Uniform DXP

## Features

- Overview assets from your Sitecore Content Hub account
- Use assets for Uniform Assets parameter

## Installation

### Prerequisites

- A Uniform team and project
- A Sitecore Content Hub account with API access

### Create Sitecore Content Hub OAuth app

1. Go to Sitecore Content Hub => Settings => API => OAuth Applications
1. Click `Create OAuth Application`
1. Define **Name**, **Client ID** and **Client Secret**
1. Update **Redirect URL**: `<VERCEL_SITE_URL>/api/auth/callback/content-hub` (e.g `https://uniform-mesh-content-hub.vercel.app/api/auth/callback/content-hub`)
1. Click `Save`

### Deploy Mesh Integration

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Funiformdev%2Funiform-mesh-sitecore-content-hub&env=CONTENT_HUB_ACCOUNT_URL,NEXTAUTH_SECRET,AUTH_APP_ID,AUTH_APP_SECRET&envDescription=see%20README%20for%20more%20info&envLink=https%3A%2F%2Fgithub.com%2Funiformdev%2Funiform-mesh-sitecore-content-hub%3Ftab%3Dreadme-ov-file%23deploy-mesh-integration&project-name=uniform-mesh-sitecore-content-hub&repository-name=uniform-mesh-sitecore-content-hub)

Sitecore Content Hub integration requires a few environment variables:

- **CONTENT_HUB_ACCOUNT_URL** - your Sitecore Content Hub instance URL (e.g. `https://your-instance.sitecorecontenthub.cloud`)
- **NEXTAUTH_URL (optional)** - your Vercel site URL (e.g. `https://content-hub.vercel.app`)
- **NEXTAUTH_SECRET** - secret key for NextAuth to sign and encrypt JWT tokens and cookies
- **AUTH_APP_ID** - OAuth Client ID for Sitecore Content Hub authentication
- **AUTH_APP_SECRET** - OAuth Client Secret for Sitecore Content Hub authentication

#### Manual deployment

1. Fork this repository (optional)
1. Create Vercel project based on the repository
1. Configure Vercel environment variables (see the list above)

### Register Mesh Integration

1. Go to Uniform dashboard => Your team => Settings => Custom Integrations
1. Click `Add Integration` and copy-paste manifest from `mesh-manifest.stable.json`
1. Replace `http://localhost:4065` in the manifest with previously deployed Vercel's site URL
1. Click `Save`

## Local development

To run the integration locally:

1. Install dependencies: `npm install`
1. Copy `.env.example` to `.env` and define required environment variables
1. Start the development server: `npm run dev`
1. Register a custom integration for your team using manifest from `mesh-manifest.local.json`
1. Register a separate Sitecore Content Hub OAuth app, use `http://localhost:4065/api/auth/callback/content-hub` for **Redirect URL**
