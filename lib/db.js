import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'fein_trade.db');

// Global reference to prevent multiple connections in dev mode
let globalDb = global;

export async function getDb() {
  if (globalDb.dbInstance) {
    return globalDb.dbInstance;
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Enable WAL journal mode for concurrent read/write support
  await db.exec('PRAGMA journal_mode=WAL;');

  // Initialize schemas if they do not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      dob           TEXT    NOT NULL,
      password_hash TEXT    NOT NULL,
      avatar        TEXT    DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      last_login    TEXT
    );

    CREATE TABLE IF NOT EXISTS trading_state (
      user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state_json    TEXT    NOT NULL DEFAULT '{}',
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  globalDb.dbInstance = db;
  return db;
}
