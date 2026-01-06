import { NextApiRequest, NextApiResponse } from 'next';
import { FetchStatusRequestPayload } from '@lib';

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { url } = req.body as FetchStatusRequestPayload;

  if (!url) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const response = await fetch(decodeURI(url), {
    method: 'GET',
  });

  res.status(response.status).send(response.statusText);
};
