// src/types/index.ts

// ── Cloudflare env bindings ─────────── //
export interface Env {
  DB:          D1Database;
  API_KEY:     string;
  ENVIRONMENT: string;
}

// ── Database row shape ──────────────── //
export interface FuelPriceRow {
  id:           number;
  month:        string;   // '2026-05'
  month_label:  string;   // 'May 2026'
  p95i:         number;
  p95c:         number;
  p93i:         number;
  d500i:        number;   // Diesel 500ppm Inland
  d500c:        number;   // Diesel 500ppm Coastal
  d50i:         number;   // Diesel 50ppm Inland
  d50c:         number;   // Diesel 50ppm Coastal
  source:       string;
  created_at:   string;
  updated_at:   string;
}

// ── API response shape ──────────────── //
export interface FuelPriceResponse {
  month:       string;
  monthLabel:  string;
  prices: {
    petrol: { p95Inland: number; p95Coastal: number; p93Inland: number };
    diesel: {
      d500Inland:  number;   // 500ppm (0.05% sulphur) — standard grade
      d500Coastal: number;
      d50Inland:   number;   // 50ppm  (0.005% sulphur) — low sulphur grade
      d50Coastal:  number;
    };
  };
  source:    string;
  updatedAt: string;
}

// ── API success / error envelopes ───── //
export interface ApiSuccess<T> {
  success: true;
  data:    T;
  meta?:   Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination meta ─────────────────── //
export interface PaginationMeta {
  total:  number;
  limit:  number;
  offset: number;
}

// ── Stats response ──────────────────── //
export interface StatsResponse {
  total_months: number;
  first_month:  string;
  latest_month: string;
  p95i_min:     number;
  p95i_max:     number;
  p95i_avg:     number;
  d005i_min:    number;
  d005i_max:    number;
  d005i_avg:    number;
}
