-- migrations/0001_initial.sql

CREATE TABLE IF NOT EXISTS fuel_prices (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  month        TEXT     NOT NULL UNIQUE,   -- '2026-05'
  month_label  TEXT     NOT NULL,           -- 'May 2026'
  p95i         REAL     NOT NULL,           -- 95 ULP Inland          (R/litre)
  p95c         REAL     NOT NULL,           -- 95 ULP Coastal         (R/litre)
  p93i         REAL     NOT NULL,           -- 93 ULP Inland          (R/litre)
  d500i        REAL     NOT NULL,           -- Diesel 500ppm Inland   (R/litre)
  d500c        REAL     NOT NULL,           -- Diesel 500ppm Coastal  (R/litre)
  d50i         REAL     NOT NULL,           -- Diesel 50ppm Inland    (R/litre)
  d50c         REAL     NOT NULL,           -- Diesel 50ppm Coastal   (R/litre)
  source       TEXT     DEFAULT 'DMRE',
  created_at   TEXT     DEFAULT (datetime('now')),
  updated_at   TEXT     DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS update_timestamp
  AFTER UPDATE ON fuel_prices
  FOR EACH ROW
BEGIN
  UPDATE fuel_prices SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_fuel_prices_month ON fuel_prices (month DESC);
