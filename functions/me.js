import { getDb } from '../utils/db.js';
import { verify } from '../utils/jwt.js';

export async function me(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, message: 'Token no proporcionado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = await verify(token, env.JWT_SECRET);
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: 'Token inválido o expirado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = getDb(env);
        const users = await sql`SELECT id, name, email, created_at FROM users WHERE id = ${payload.user_id}`;

        if (users.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Usuario no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = users[0];

        return new Response(JSON.stringify({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en me:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
