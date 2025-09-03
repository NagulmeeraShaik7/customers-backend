import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db;

export function initDb(dbPath = process.env.SQLITE_FILE || 'src/data/customers.db') {
  // Always resolve to absolute path
  const absPath = path.resolve(dbPath);
  const dir = path.dirname(absPath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open DB and enable foreign keys
  db = new Database(absPath);
  db.pragma('foreign_keys = ON');

  // Customers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      accountType TEXT DEFAULT 'standard',
      hasOnlyOneAddress INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `).run();

  // Addresses table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT DEFAULT 'India',
      pincode TEXT NOT NULL,
      isPrimary INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(customerId) REFERENCES customers(id) ON DELETE CASCADE
    );
  `).run();

  // Useful indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_addresses_state ON addresses(state)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON addresses(pincode)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`).run();

  console.log(`✅ SQLite DB initialized at: ${absPath}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export default { initDb, getDb };
