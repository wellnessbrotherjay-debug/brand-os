
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL or DIRECT_URL in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runFix() {
  console.log('Reading SQL file...');
  const sql = fs.readFileSync(path.resolve(__dirname, 'fix-schema.sql'), 'utf8');
  
  try {
    console.log('Connecting to database and executing SQL...');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('✅ SQL executed successfully!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error executing SQL:', err.message);
    if (err.position) {
      console.error('Error position:', err.position);
      // Log some context around the error
      const pos = parseInt(err.position);
      console.error('Near:', sql.substring(Math.max(0, pos - 50), Math.min(sql.length, pos + 50)));
    }
  } finally {
    await pool.end();
  }
}

runFix();
