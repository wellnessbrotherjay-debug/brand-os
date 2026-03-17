const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.bwndbccgzjdgtcyornwn:Jay25Eliana!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function applySchema() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, 'fix-schema.sql');
        console.log(`Reading SQL from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running schema fixes...');
        await client.query(sql);
        console.log('Schema fixes applied successfully.');
    } catch (err) {
        console.error('Failed to apply schema:', err);
    } finally {
        await client.end();
    }
}

applySchema();
