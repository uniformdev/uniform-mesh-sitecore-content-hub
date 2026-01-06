import { ApiRequestPayload, PlainTextApiResult } from '@lib';
import { NextApiRequest, NextApiResponse } from 'next';

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { apiUrl, method, body, headers, token } = req.body as ApiRequestPayload;

  if (!apiUrl || !method) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const finalHeaders = headers ?? {
    Accept: 'application/json, text/plain',
  };

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }

  const response = await fetch(decodeURI(apiUrl), {
    method: method,
    headers: Object.keys(finalHeaders).length ? finalHeaders : undefined,
    body: body ? JSON.stringify(body, null, 2) : undefined,
  });

  const text = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    const plainTextResponse: PlainTextApiResult = { plainText: text };
    res.status(response.status).json(plainTextResponse);
    return;
  }

  try {
    const json = JSON.parse(text);
    res.status(response.status).json(json);
  } catch {
    res.status(response.status).send(text);
  }
};
