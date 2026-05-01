import type { Cookies } from '@sveltejs/kit';

export interface AdminAuthEnv {
	BLOG_ADMIN_PASSWORD?: string;
	BLOG_ADMIN_SESSION_SECRET?: string;
}

export const ADMIN_SESSION_COOKIE = 'blog_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const encodeBase64Url = (input: Uint8Array) =>
	btoa(String.fromCharCode(...input))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');

const decodeBase64Url = (input: string) => {
	const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
	const raw = atob(padded);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
	return bytes;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a[i] ^ b[i];
	}
	return result === 0;
};

const getSessionSecret = (env: AdminAuthEnv | undefined) =>
	env?.BLOG_ADMIN_SESSION_SECRET || env?.BLOG_ADMIN_PASSWORD || 'admin-change-me';

const sign = async (value: string, env: AdminAuthEnv | undefined) => {
	const secret = encoder.encode(getSessionSecret(env));
	const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	return new Uint8Array(signature);
};

export const getAdminPassword = (env: AdminAuthEnv | undefined) => env?.BLOG_ADMIN_PASSWORD ?? 'admin';

export const createAdminSessionToken = async (env: AdminAuthEnv | undefined) => {
	const now = Math.floor(Date.now() / 1000);
	const payload = { iat: now, exp: now + SESSION_TTL_SECONDS };
	const payloadB64 = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
	const signature = await sign(payloadB64, env);
	return `${payloadB64}.${encodeBase64Url(signature)}`;
};

export const verifyAdminSessionToken = async (token: string, env: AdminAuthEnv | undefined) => {
	const [payloadB64, signatureB64] = token.split('.');
	if (!payloadB64 || !signatureB64) return false;

	try {
		const expected = await sign(payloadB64, env);
		const received = decodeBase64Url(signatureB64);
		if (!timingSafeEqual(received, expected)) return false;

		const payloadRaw = decoder.decode(decodeBase64Url(payloadB64));
		const payload = JSON.parse(payloadRaw) as { exp?: number };
		if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
		return true;
	} catch {
		return false;
	}
};

export const isAdminAuthenticated = async (cookies: Cookies, env: AdminAuthEnv | undefined) => {
	const token = cookies.get(ADMIN_SESSION_COOKIE);
	if (!token) return false;
	return verifyAdminSessionToken(token, env);
};

export const getAdminCookieOptions = (request: Request) => {
	const hostname = new URL(request.url).hostname;
	const secure = hostname !== 'localhost' && hostname !== '127.0.0.1';

	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure,
		maxAge: SESSION_TTL_SECONDS
	};
};
