// src/middleware/response.ts

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, ...(meta ? { meta } : {}), data }),
    { status, headers: CORS_HEADERS }
  );
}

export function err(code: string, message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: CORS_HEADERS }
  );
}

export function cors(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
