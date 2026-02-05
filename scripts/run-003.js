
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const connectionString = process.env.NEXTAUTH_DATABASE_URL || 'postgresql://postgres.bwndbccgzjdgtcyornwn:Jay25Eliana!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sql = fs.readFileSync(path.join(__dirname, '../migrations/003_create_social_integrations.sql'), 'utf8');
        console.log('Running 003_create_social_integrations.sql...');
        await client.query(sql);
        console.log('Success!');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

runMigration();
