import { getDb } from '../utils/db.js';
import { verifyPassword } from '../utils/hash.js';
import { sign } from '../utils/jwt.js';

export async function login(request, env) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Faltan datos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = getDb(env);
        const users = await sql`SELECT id, password_hash, name, created_at FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'El correo no existe' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = users[0];
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return new Response(JSON.stringify({ success: false, message: 'Contraseña incorrecta' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Token válido por 7 días (en segundos)
        const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
        const token = await sign({ user_id: user.id, email: email, exp }, env.JWT_SECRET);

        return new Response(JSON.stringify({
            success: true,
            message: 'Login correcto',
            token,
            user_id: user.id,
            name: user.name,
            created_at: user.created_at
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
