import type { RequestHandler } from './$types';
import {
	ADMIN_SESSION_COOKIE,
	createAdminSessionToken,
	getAdminCookieOptions,
	getAdminPassword,
	isAdminAuthenticated,
	type AdminAuthEnv
} from '$lib/server/adminAuth';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

export const GET: RequestHandler = async ({ cookies, platform }) => {
	const env = platform?.env as AdminAuthEnv | undefined;
	const authenticated = await isAdminAuthenticated(cookies, env);
	return json({ authenticated });
};

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	try {
		const env = platform?.env as AdminAuthEnv | undefined;
		const { password } = (await request.json()) as { password?: string };

		if (typeof password !== 'string') {
			return json({ success: false }, 400);
		}

		const adminPassword = getAdminPassword(env);
		if (password !== adminPassword) {
			return json({ success: false }, 401);
		}

		const token = await createAdminSessionToken(env);
		cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions(request));

		return json({ success: true });
	} catch (error) {
		console.error('Authentication failed:', error);
		return json({ error: 'Authentication failed' }, 500);
	}
};

export const DELETE: RequestHandler = async ({ cookies, request }) => {
	cookies.delete(ADMIN_SESSION_COOKIE, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: getAdminCookieOptions(request).secure
	});
	return json({ success: true });
};
