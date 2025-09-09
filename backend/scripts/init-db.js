const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const path = require('path');

async function initDatabase() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    try {
        console.log('Running database migrations...');
        await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
        console.log('Database migrations completed successfully');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

initDatabase();
