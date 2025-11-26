import { register } from './functions/register.js';
import { login } from './functions/login.js';
import { me } from './functions/me.js';
import { updateProfile } from './functions/updateProfile.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;

        // Configuración CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://amrusbeta.pages.dev',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        };

        // Manejar preflight requests (OPTIONS)
        if (method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders,
            });
        }

        // Función helper para añadir headers CORS a la respuesta
        const withCors = (response) => {
            const newHeaders = new Headers(response.headers);
            for (const [key, value] of Object.entries(corsHeaders)) {
                newHeaders.set(key, value);
            }
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        };

        try {
            let response;

            // Router
            if (method === 'POST' && url.pathname === '/register') {
                response = await register(request, env);
            } else if (method === 'POST' && url.pathname === '/login') {
                response = await login(request, env);
            } else if (method === 'GET' && url.pathname === '/me') {
                response = await me(request, env);
            } else if (method === 'PUT' && url.pathname === '/updateProfile') {
                response = await updateProfile(request, env);
            } else {
                response = new Response(JSON.stringify({ success: false, message: 'Ruta no encontrada' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return withCors(response);

        } catch (e) {
            console.error('Error no controlado:', e);
            return withCors(new Response(JSON.stringify({ success: false, message: 'Error interno del servidor' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
    },
};
