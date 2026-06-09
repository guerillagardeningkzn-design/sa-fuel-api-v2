// src/middleware/auth.ts

import { Env }  from '../types/index.ts';
import { err }  from './response.ts';

export function requireApiKey(request: Request, env: Env): Response | null {
  const authHeader = request.headers.get('Authorization') ?? '';
  const fromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const fromQuery  = new URL(request.url).searchParams.get('api_key');
  const provided   = fromHeader ?? fromQuery;

  if (!provided) {
    return err('MISSING_API_KEY', 'API key required for write operations.', 401);
  }
  if (provided !== env.API_KEY) {
    return err('INVALID_API_KEY', 'Invalid API key.', 403);
  }

  return null; // null = auth passed
}
