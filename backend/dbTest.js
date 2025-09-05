// dbTest.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,      // Render DB host
  user: process.env.DB_USER,      // DB user
  password: process.env.DB_PASS,  // DB password
  database: process.env.DB_NAME,  // DB name
  port: process.env.DB_PORT,      // usually 5432
  ssl: { rejectUnauthorized: false } // required for Render Postgres
});

async function testDB() {
  try {
    console.log("🔌 Connecting to database...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!");

    // List tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public';
    `);
    console.log("📋 Tables in DB:", tables.rows.map(r => r.table_name));

    // Check recordings table
    const recordings = await client.query("SELECT * FROM recordings ORDER BY created_at DESC;");
    console.log(`🎥 Found ${recordings.rows.length} recordings:`);
    console.table(recordings.rows);

    client.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ DB error:", err.message);
    process.exit(1);
  }
}

testDB();
