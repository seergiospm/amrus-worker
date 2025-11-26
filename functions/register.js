import { getDb } from '../utils/db.js';
import { hashPassword } from '../utils/hash.js';

export async function register(request, env) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Faltan datos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = getDb(env);

        // Verificar si el email ya existe
        const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existingUsers.length > 0) {
            return new Response(JSON.stringify({ success: false, message: 'El correo electrónico ya está registrado' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const passwordHash = await hashPassword(password);

        const result = await sql`
            INSERT INTO users (name, email, password_hash)
            VALUES (${name}, ${email}, ${passwordHash})
            RETURNING id
        `;

        return new Response(JSON.stringify({
            success: true,
            message: 'Usuario registrado correctamente',
            user_id: result[0].id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en register:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
