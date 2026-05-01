import type { RequestHandler } from './$types';
import { isAdminAuthenticated, type AdminAuthEnv } from '$lib/server/adminAuth';
import {
	ensureGuestbookSchema,
	normalizeFingerprint,
	normalizeIp,
	type BanType
} from '$lib/server/guestbookModeration';

interface Env extends AdminAuthEnv {
	DB: D1Database;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const normalizeBanValue = (type: BanType, value: string) => {
	if (type === 'ip') return normalizeIp(value);
	return normalizeFingerprint(value);
};

export const GET: RequestHandler = async ({ platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) return json({ error: 'Unauthorized' }, 401);

	try {
		const db = env?.DB;
		if (!db) return json({ error: 'Database not available.' }, 500);

		await ensureGuestbookSchema(db);

		const result = await db
			.prepare('SELECT id, type, value, reason, created_at FROM guestbook_bans ORDER BY created_at DESC')
			.all();
		return json({ bans: result.results || [] });
	} catch (error) {
		console.error('Error fetching guestbook bans:', error);
		return json({ error: 'Failed to fetch bans.' }, 500);
	}
};

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) return json({ error: 'Unauthorized' }, 401);

	try {
		const db = env?.DB;
		if (!db) return json({ error: 'Database not available.' }, 500);
		await ensureGuestbookSchema(db);

		const { type, value, reason } = (await request.json()) as {
			type?: BanType;
			value?: string;
			reason?: string;
		};

		if (type !== 'ip' && type !== 'fingerprint') {
			return json({ error: "Invalid ban type. Use 'ip' or 'fingerprint'." }, 400);
		}

		const normalizedValue = normalizeBanValue(type, value ?? '');
		if (!normalizedValue) {
			return json({ error: 'Invalid ban value.' }, 400);
		}

		const reasonText = typeof reason === 'string' ? reason.trim().slice(0, 200) : null;
		const result = await db
			.prepare('INSERT OR IGNORE INTO guestbook_bans (type, value, reason) VALUES (?, ?, ?)')
			.bind(type, normalizedValue, reasonText)
			.run();

		if (!result.success) {
			return json({ error: 'Failed to create ban.' }, 500);
		}

		return json({ success: true, inserted: (result.meta?.changes ?? 0) > 0 });
	} catch (error) {
		console.error('Error creating guestbook ban:', error);
		return json({ error: 'Failed to create ban.' }, 500);
	}
};

export const DELETE: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) return json({ error: 'Unauthorized' }, 401);

	try {
		const db = env?.DB;
		if (!db) return json({ error: 'Database not available.' }, 500);
		await ensureGuestbookSchema(db);

		const { type, value } = (await request.json()) as { type?: BanType; value?: string };
		if (type !== 'ip' && type !== 'fingerprint') {
			return json({ error: "Invalid ban type. Use 'ip' or 'fingerprint'." }, 400);
		}

		const normalizedValue = normalizeBanValue(type, value ?? '');
		if (!normalizedValue) {
			return json({ error: 'Invalid ban value.' }, 400);
		}

		const result = await db
			.prepare('DELETE FROM guestbook_bans WHERE type = ? AND value = ?')
			.bind(type, normalizedValue)
			.run();
		return json({ success: true, removed: (result.meta?.changes ?? 0) > 0 });
	} catch (error) {
		console.error('Error deleting guestbook ban:', error);
		return json({ error: 'Failed to delete ban.' }, 500);
	}
};
