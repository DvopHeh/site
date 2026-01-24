import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	try {
		const { password } = await request.json();
		
		// Get admin password from environment
		const env = platform?.env as { BLOG_ADMIN_PASSWORD?: string } | undefined;
		const adminPassword = env?.BLOG_ADMIN_PASSWORD || 'admin'; // fallback for dev
		
		if (password === adminPassword) {
			cookies.set('blog_admin_auth', 'authenticated', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 // 24 hours
			});
			
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		return new Response(JSON.stringify({ success: false }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Authentication failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('blog_admin_auth', { path: '/' });
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
