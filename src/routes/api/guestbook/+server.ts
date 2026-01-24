import type { RequestHandler } from './$types';

interface Env {
	DB: D1Database;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const env = platform?.env as Env | undefined;
		
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const message = formData.get('message')?.toString().trim();

		if (!name || !message) {
			return new Response(
				JSON.stringify({ error: 'Please fill in both name and message fields.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (name.length > 20) {
			return new Response(
				JSON.stringify({ error: 'Name must be 20 characters or less.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (message.length > 500) {
			return new Response(
				JSON.stringify({ error: 'Message must be 500 characters or less.' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const db = env?.DB;
		if (!db) {
			return new Response(
				JSON.stringify({ error: 'Database not available.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const result = await db.prepare(
			'INSERT INTO guestbook (name, message) VALUES (?, ?)'
		).bind(name, message).run();

		if (!result.success) {
			return new Response(
				JSON.stringify({ error: 'Failed to save entry. Please try again.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error saving guestbook entry:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to save entry. Please try again.' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const env = platform?.env as Env | undefined;
		const db = env?.DB;
		
		if (!db) {
			return new Response(
				JSON.stringify({ error: 'Database not available.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const result = await db.prepare(
			'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT 50'
		).all();

		return new Response(
			JSON.stringify({ entries: result.results || [] }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error fetching guestbook entries:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to fetch entries.' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
