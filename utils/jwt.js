// Utilidad JWT usando Web Crypto API (nativo en Workers)

async function getKey(secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

function base64UrlEncode(str) {
    return btoa(String.fromCharCode(...new Uint8Array(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

export async function sign(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

    const key = await getKey(secret);
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    const encodedSignature = base64UrlEncode(signature);
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verify(token, secret) {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        throw new Error('Invalid token format');
    }

    const key = await getKey(secret);
    const signature = base64UrlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!isValid) {
        throw new Error('Invalid signature');
    }

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));

    if (payload.exp && Date.now() / 1000 > payload.exp) {
        throw new Error('Token expired');
    }

    return payload;
}
