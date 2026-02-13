import type { RequestHandler } from './$types';
import { Profanity } from '@2toad/profanity';

interface Env {
	DB: D1Database;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const NAME_MAX = 20;
const MESSAGE_MAX = 500;
const COOLDOWN_SECONDS = 30;

const profanityFilter = new Profanity({
	languages: ['en'],
	wholeWord: true
});
const profanityFilterLoose = new Profanity({
	languages: ['en'],
	wholeWord: false
});
const HARD_BLOCK_NORMALIZED_TERMS = ['nigger', 'nigga', 'faggot', 'kike', 'chink', 'spic'];

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const normalizeInput = (value: string) =>
	value
		.replace(/\r\n/g, '\n')
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
		.trim();

const normalizeForFilter = (value: string) =>
	value
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.replace(/[0@]/g, 'o')
		.replace(/1|!/g, 'i')
		.replace(/3/g, 'e')
		.replace(/4/g, 'a')
		.replace(/5|\$/g, 's')
		.replace(/7/g, 't');

const containsBlockedLanguage = (name: string, message: string) => {
	const combined = `${name} ${message}`;
	const compact = normalizeForFilter(combined);
	return (
		profanityFilter.exists(combined) ||
		profanityFilterLoose.exists(compact) ||
		HARD_BLOCK_NORMALIZED_TERMS.some((term) => compact.includes(term))
	);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const env = platform?.env as Env | undefined;

		const formData = await request.formData();
		const name = normalizeInput(formData.get('name')?.toString() ?? '');
		const message = normalizeInput(formData.get('message')?.toString() ?? '');

		if (!name || !message) {
			return json({ error: 'Please fill in both name and message fields.' }, 400);
		}

		if (name.length < 2) {
			return json({ error: 'Name must be at least 2 characters.' }, 400);
		}

		if (name.length > NAME_MAX) {
			return json({ error: `Name must be ${NAME_MAX} characters or less.` }, 400);
		}

		if (message.length < 2) {
			return json({ error: 'Message must be at least 2 characters.' }, 400);
		}

		if (message.length > MESSAGE_MAX) {
			return json({ error: `Message must be ${MESSAGE_MAX} characters or less.` }, 400);
		}

		if (containsBlockedLanguage(name, message)) {
			return json(
				{ error: 'Nuh uh, bad person!' },
				400
			);
		}

		const db = env?.DB;
		if (!db) {
			return json({ error: 'Database not available.' }, 500);
		}

		const latestResult = await db
			.prepare('SELECT created_at FROM guestbook WHERE name = ? ORDER BY created_at DESC LIMIT 1')
			.bind(name)
			.first<{ created_at: string }>();
		if (latestResult?.created_at) {
			const lastPostTimestamp = new Date(`${latestResult.created_at.replace(' ', 'T')}Z`).getTime();
			if (!Number.isNaN(lastPostTimestamp)) {
				const secondsSinceLastPost = (Date.now() - lastPostTimestamp) / 1000;
				if (secondsSinceLastPost < COOLDOWN_SECONDS) {
					return json(
						{
							error: `Slow down a bit. Please wait ${Math.ceil(COOLDOWN_SECONDS - secondsSinceLastPost)}s before posting again.`
						},
						429
					);
				}
			}
		}

		const result = await db.prepare(
			'INSERT INTO guestbook (name, message) VALUES (?, ?)'
		).bind(name, message).run();

		if (!result.success) {
			return json({ error: 'Failed to save entry. Please try again.' }, 500);
		}

		const insertedEntry = await db
			.prepare('SELECT id, name, message, created_at FROM guestbook WHERE id = ? LIMIT 1')
			.bind(result.meta?.last_row_id ?? -1)
			.first<{ id: number; name: string; message: string; created_at: string }>();

		return json({ success: true, entry: insertedEntry ?? null });
	} catch (error) {
		console.error('Error saving guestbook entry:', error);
		return json({ error: 'Failed to save entry. Please try again.' }, 500);
	}
};

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const env = platform?.env as Env | undefined;
		const db = env?.DB;

		if (!db) {
			return json({ error: 'Database not available.' }, 500);
		}

		const result = await db.prepare(
			'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT 50'
		).all();

		return json({ entries: result.results || [] });
	} catch (error) {
		console.error('Error fetching guestbook entries:', error);
		return json({ error: 'Failed to fetch entries.' }, 500);
	}
};
