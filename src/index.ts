// src/index.ts
// SA Fuel Price API — Cloudflare Worker
// MD Works · Project 05

import { Env } from './types/index.ts';
import { ok, err, cors } from './middleware/response.ts';
import {
  handleGetAll,
  handleGetLatest,
  handleGetRange,
  handleGetStats,
  handleGetByMonth,
  handlePost,
  handlePut,
} from './routes/prices.ts';

// ── Router ──────────────────────────── //
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') return cors();

    try {
      // ── Root / health ────────────── //
      if (path === '/' && method === 'GET') {
        return ok({
          name: 'SA Fuel Price API',
          version: '2.0.0',
          description: 'Monthly South African fuel retail prices — DMRE gazette data',
          author: 'MD Works · Morney Deetlefs',
          docs: `${url.origin}/docs`,
          endpoints: {
            allPrices: 'GET  /v1/prices',
            latest: 'GET  /v1/prices/latest',
            byMonth: 'GET  /v1/prices/:month  (YYYY-MM)',
            range: 'GET  /v1/prices/range?from=YYYY-MM&to=YYYY-MM',
            stats: 'GET  /v1/stats',
            addMonth: 'POST /v1/prices          (API key required)',
            updateMonth: 'PUT  /v1/prices/:month   (API key required)',
          },
        });
      }

      // ── Docs ─────────────────────── //
      if (path === '/docs' && method === 'GET') {
        return Response.redirect(new URL('/docs.html', url.origin).toString(), 301);
      }

      // ── Stats ─────────────────────── //
      if (path === '/v1/stats' && method === 'GET') {
        return handleGetStats(request, env);
      }

      // ── Prices collection ─────────── //
      if (path === '/v1/prices') {
        if (method === 'GET') return handleGetAll(request, env);
        if (method === 'POST') return handlePost(request, env);
      }

      // ── Prices sub-routes ─────────── //
      if (path === '/v1/prices/latest' && method === 'GET') {
        return handleGetLatest(request, env);
      }
      if (path === '/v1/prices/range' && method === 'GET') {
        return handleGetRange(request, env);
      }

      // ── Prices by month ───────────── //
      const monthMatch = path.match(/^\/v1\/prices\/([^/]+)$/);
      if (monthMatch) {
        const month = monthMatch[1];
        if (method === 'GET') return handleGetByMonth(request, env, month);
        if (method === 'PUT') return handlePut(request, env, month);
      }

      // ── 404 ───────────────────────── //
      return err('NOT_FOUND', `Route ${method} ${path} not found.`, 404);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[${method}] ${path} —`, message);
      return err('SERVER_ERROR', 'An unexpected error occurred.', 500);
    }
  },
};
