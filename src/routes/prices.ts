// src/routes/prices.ts

import { z }              from 'zod';
import { Env }            from '../types/index.ts';
import { ok, err }        from '../middleware/response.ts';
import { requireApiKey }  from '../middleware/auth.ts';
import * as db            from '../db/queries.ts';

// ── Validation schemas ──────────────── //
const MonthParam = z.string().regex(
  /^\d{4}-(0[1-9]|1[0-2])$/,
  'Month must be in YYYY-MM format'
);

const PostBody = z.object({
  month:      MonthParam,
  monthLabel: z.string().min(1),
  p95i:       z.number().positive(),
  p95c:       z.number().positive(),
  p93i:       z.number().positive(),
  d500i:      z.number().positive(),
  d500c:      z.number().positive(),
  d50i:       z.number().positive(),
  d50c:       z.number().positive(),
  source:     z.string().optional(),
});

const PutBody = z.object({
  p95i:   z.number().positive().optional(),
  p95c:   z.number().positive().optional(),
  p93i:   z.number().positive().optional(),
  d500i:  z.number().positive().optional(),
  d500c:  z.number().positive().optional(),
  d50i:   z.number().positive().optional(),
  d50c:   z.number().positive().optional(),
  source: z.string().optional(),
}).refine(
  obj => Object.keys(obj).length > 0,
  'At least one field required'
);

// ── GET /v1/prices ──────────────────── //
export async function handleGetAll(
  request: Request, env: Env
): Promise<Response> {
  const url    = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  ?? '50'), 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0'),  0);

  const { rows, total } = await db.getAll(env.DB, limit, offset);
  return ok(rows.map(db.formatRow), { total, limit, offset });
}

// ── GET /v1/prices/latest ───────────── //
export async function handleGetLatest(
  _req: Request, env: Env
): Promise<Response> {
  const row = await db.getLatest(env.DB);
  if (!row) return err('NOT_FOUND', 'No price data found.', 404);
  return ok(db.formatRow(row));
}

// ── GET /v1/prices/range ────────────── //
export async function handleGetRange(
  request: Request, env: Env
): Promise<Response> {
  const url  = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to   = url.searchParams.get('to')   ?? '';

  const fromResult = MonthParam.safeParse(from);
  const toResult   = MonthParam.safeParse(to);

  if (!fromResult.success || !toResult.success) {
    return err('INVALID_FORMAT', 'Use YYYY-MM format for from and to params.');
  }

  const rows = await db.getRange(env.DB, from, to);
  return ok(rows.map(db.formatRow), { count: rows.length, from, to });
}

// ── GET /v1/stats ───────────────────── //
export async function handleGetStats(
  _req: Request, env: Env
): Promise<Response> {
  const stats = await db.getStats(env.DB);
  if (!stats) return err('NOT_FOUND', 'No data found.', 404);
  return ok(stats);
}

// ── GET /v1/prices/:month ───────────── //
export async function handleGetByMonth(
  _req: Request, env: Env, month: string
): Promise<Response> {
  const parsed = MonthParam.safeParse(month);
  if (!parsed.success) {
    return err('INVALID_FORMAT', parsed.error.errors[0].message);
  }

  const row = await db.getByMonth(env.DB, month);
  if (!row) return err('NOT_FOUND', `No prices found for ${month}.`, 404);
  return ok(db.formatRow(row));
}

// ── POST /v1/prices ─────────────────── //
export async function handlePost(
  request: Request, env: Env
): Promise<Response> {
  const authErr = requireApiKey(request, env);
  if (authErr) return authErr;

  let body: unknown;
  try { body = await request.json(); }
  catch { return err('INVALID_JSON', 'Request body is not valid JSON.'); }

  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.errors[0].message);
  }

  try {
    const row = await db.insertPrice(env.DB, parsed.data);
    if (!row) return err('SERVER_ERROR', 'Insert failed.', 500);
    return ok(db.formatRow(row), undefined, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE constraint')) {
      return err('CONFLICT', 'A record for that month already exists.', 409);
    }
    throw e;
  }
}

// ── PUT /v1/prices/:month ───────────── //
export async function handlePut(
  request: Request, env: Env, month: string
): Promise<Response> {
  const authErr = requireApiKey(request, env);
  if (authErr) return authErr;

  const monthParsed = MonthParam.safeParse(month);
  if (!monthParsed.success) {
    return err('INVALID_FORMAT', monthParsed.error.errors[0].message);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return err('INVALID_JSON', 'Request body is not valid JSON.'); }

  const parsed = PutBody.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', parsed.error.errors[0].message);
  }

  const row = await db.updatePrice(env.DB, month, parsed.data);
  if (!row) return err('NOT_FOUND', `No record found for ${month}.`, 404);
  return ok(db.formatRow(row));
}
