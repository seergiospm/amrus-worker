import postgres from 'postgres';

let sql;

export function getDb(env) {
    if (!sql) {
        // Se crea la conexión solo si no existe
        sql = postgres(env.SUPABASE_DB_URL, {
            ssl: 'require',
            // Opciones adicionales para serverless si fueran necesarias
            // idle_timeout: 20,
            // max_lifetime: 60 * 30,
        });
    }
    return sql;
}
