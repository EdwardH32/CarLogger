const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "carlogger.db"));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    nickname TEXT,
    base_hp REAL NOT NULL,
    base_torque REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cost REAL NOT NULL DEFAULT 0,
    install_date TEXT,
    estimated_hp_gain REAL,
    estimated_torque_gain REAL,
    ai_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    description TEXT,
    cost REAL NOT NULL DEFAULT 0,
    service_date TEXT,
    mileage INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS performance (
    car_id INTEGER PRIMARY KEY REFERENCES cars(id) ON DELETE CASCADE,
    zero_to_60 REAL,
    top_speed REAL,
    nordschleife_time TEXT,
    summary TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS track_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    track_name TEXT NOT NULL,
    lap_time TEXT,
    summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS maintenance_intervals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    part TEXT NOT NULL,
    interval_miles INTEGER,
    interval_months INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wear_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    part TEXT NOT NULL,
    typical_mileage INTEGER,
    severity TEXT,
    symptoms TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dyno_curves (
    car_id INTEGER PRIMARY KEY REFERENCES cars(id) ON DELETE CASCADE,
    redline_rpm INTEGER,
    points TEXT NOT NULL,
    summary TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS car_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// cars.mileage was added after the initial release — add it if this DB predates it.
const carColumns = db.prepare("PRAGMA table_info(cars)").all().map((c) => c.name);
if (!carColumns.includes("mileage")) {
  db.exec("ALTER TABLE cars ADD COLUMN mileage INTEGER");
}
if (!carColumns.includes("nickname")) {
  db.exec("ALTER TABLE cars ADD COLUMN nickname TEXT");
}

module.exports = db;
