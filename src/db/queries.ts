// src/db/queries.ts

import { FuelPriceRow, FuelPriceResponse, StatsResponse } from '../types/index.ts';

// ── Shape a D1 row into the API response ── //
export function formatRow(row: FuelPriceRow): FuelPriceResponse {
  return {
    month:      row.month,
    monthLabel: row.month_label,
    prices: {
      petrol: {
        p95Inland:  round(row.p95i),
        p95Coastal: round(row.p95c),
        p93Inland:  round(row.p93i),
      },
      diesel: {
        d500Inland:  round(row.d500i),
        d500Coastal: round(row.d500c),
        d50Inland:   round(row.d50i),
        d50Coastal:  round(row.d50c),
      },
    },
    source:    row.source,
    updatedAt: row.updated_at,
  };
}

// ── Queries ─────────────────────────────── //
export async function getAll(
  db: D1Database,
  limit: number,
  offset: number
): Promise<{ rows: FuelPriceRow[]; total: number }> {
  const [data, count] = await Promise.all([
    db.prepare(
      `SELECT * FROM fuel_prices ORDER BY month DESC LIMIT ?1 OFFSET ?2`
    ).bind(limit, offset).all<FuelPriceRow>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM fuel_prices`
    ).first<{ count: number }>(),
  ]);

  return {
    rows:  data.results,
    total: count?.count ?? 0,
  };
}

export async function getLatest(db: D1Database): Promise<FuelPriceRow | null> {
  return db.prepare(
    `SELECT * FROM fuel_prices ORDER BY month DESC LIMIT 1`
  ).first<FuelPriceRow>();
}

export async function getByMonth(
  db: D1Database,
  month: string
): Promise<FuelPriceRow | null> {
  return db.prepare(
    `SELECT * FROM fuel_prices WHERE month = ?1`
  ).bind(month).first<FuelPriceRow>();
}

export async function getRange(
  db: D1Database,
  from: string,
  to: string
): Promise<FuelPriceRow[]> {
  const result = await db.prepare(
    `SELECT * FROM fuel_prices WHERE month BETWEEN ?1 AND ?2 ORDER BY month ASC`
  ).bind(from, to).all<FuelPriceRow>();
  return result.results;
}

export async function getStats(db: D1Database): Promise<StatsResponse | null> {
  return db.prepare(`
    SELECT
      COUNT(*)                                     AS total_months,
      MIN(month)                                   AS first_month,
      MAX(month)                                   AS latest_month,
      ROUND(MIN(p95i),  2)                         AS p95i_min,
      ROUND(MAX(p95i),  2)                         AS p95i_max,
      ROUND(AVG(p95i),  2)                         AS p95i_avg,
      ROUND(MIN(d005i), 2)                         AS d005i_min,
      ROUND(MAX(d005i), 2)                         AS d005i_max,
      ROUND(AVG(d005i), 2)                         AS d005i_avg
    FROM fuel_prices
  `).first<StatsResponse>();
}

export async function insertPrice(
  db: D1Database,
  data: {
    month: string; monthLabel: string;
    p95i: number; p95c: number; p93i: number;
    d500i: number; d500c: number;
    d50i: number;  d50c: number;
    source?: string;
  }
): Promise<FuelPriceRow | null> {
  return db.prepare(`
    INSERT INTO fuel_prices
      (month, month_label, p95i, p95c, p93i, d500i, d500c, d50i, d50c, source)
    VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
    RETURNING *
  `).bind(
    data.month, data.monthLabel,
    data.p95i, data.p95c, data.p93i,
    data.d500i, data.d500c,
    data.d50i,  data.d50c,
    data.source ?? 'DMRE'
  ).first<FuelPriceRow>();
}

export async function updatePrice(
  db: D1Database,
  month: string,
  fields: Partial<Pick<FuelPriceRow, 'p95i'|'p95c'|'p93i'|'d500i'|'d500c'|'d50i'|'d50c'|'source'>>
): Promise<FuelPriceRow | null> {
  const now = new Date().toISOString();
  return db.prepare(`
    UPDATE fuel_prices SET
      p95i       = COALESCE(?1,  p95i),
      p95c       = COALESCE(?2,  p95c),
      p93i       = COALESCE(?3,  p93i),
      d500i      = COALESCE(?4,  d500i),
      d500c      = COALESCE(?5,  d500c),
      d50i       = COALESCE(?6,  d50i),
      d50c       = COALESCE(?7,  d50c),
      source     = COALESCE(?8,  source),
      updated_at = ?9
    WHERE month = ?10
    RETURNING *
  `).bind(
    fields.p95i  ?? null,
    fields.p95c  ?? null,
    fields.p93i  ?? null,
    fields.d500i ?? null,
    fields.d500c ?? null,
    fields.d50i  ?? null,
    fields.d50c  ?? null,
    fields.source ?? null,
    now, month
  ).first<FuelPriceRow>();
}

// ── Utility ──────────────────────────────── //
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
