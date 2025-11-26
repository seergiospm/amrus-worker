import { getDb } from '../utils/db.js';
import { verify } from '../utils/jwt.js';

export async function updateProfile(request, env) {
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

        const { name } = await request.json();
        if (!name) {
            return new Response(JSON.stringify({ success: false, message: 'Faltan datos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = getDb(env);
        const result = await sql`
            UPDATE users SET name = ${name}
            WHERE id = ${payload.user_id}
            RETURNING id, name
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Usuario no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: {
                id: result[0].id,
                name: result[0].name
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en updateProfile:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
