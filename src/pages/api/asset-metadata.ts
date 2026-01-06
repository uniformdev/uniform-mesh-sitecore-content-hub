import { AssetMetadataRequestPayload, AssetMetadataResponsePayload } from '@lib';
import { NextApiRequest, NextApiResponse } from 'next';

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { assetUrl: imageUrl } = req.body as AssetMetadataRequestPayload;

  if (!imageUrl) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const response = await fetch(decodeURI(imageUrl), {
    method: 'GET',
  });

  const result: AssetMetadataResponsePayload = {
    contentType: response.headers.get('content-type') ?? '',
    contentLength: parseInt(response.headers.get('content-length') ?? '0'),
  };

  res.status(response.status).json(result);
};
