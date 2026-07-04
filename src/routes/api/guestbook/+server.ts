// the guestbook. GET reads the latest entries, POST adds one after running it
// through a gauntlet of checks: banned? empty? too long? slurs? posting too
// fast? if it survives all that it goes in D1 and gets logged to R2
import type { RequestHandler } from './$types';
import {
	ensureGuestbookSchema,
	getClientIp,
	getMatchingBan,
	normalizeFingerprint,
	normalizeUserAgent,
	writeGuestbookAuditLog
} from '$lib/server/guestbookModeration';

interface Env {
	DB: D1Database;
	GUESTBOOK_LOGS?: R2Bucket;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const NAME_MAX = 20;
const MESSAGE_MAX = 500;
const COOLDOWN_SECONDS = 30;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const normalizeInput = (value: string) =>
	value
		.replace(/\r\n/g, '\n')
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
		.trim();

// language filter — swearing is completely fine here, we only block slurs.
// no more blanket profanity list, so people can say fuck/shit/whatever

// visual lookalikes from other scripts (cyrillic а, greek ο, dotless ı, ...) mapped
// to the ascii letter they're impersonating. this is the "weird i" fix — someone
// typed "nigga" with a cyrillic i and it sailed right through the old filter
const HOMOGLYPHS: Record<string, string> = {
	а: 'a', ɑ: 'a', α: 'a',
	ь: 'b',
	с: 'c', ϲ: 'c',
	ԁ: 'd',
	е: 'e', ε: 'e', ϵ: 'e',
	ɡ: 'g',
	һ: 'h',
	і: 'i', ї: 'i', ı: 'i', ɩ: 'i', ι: 'i',
	ј: 'j',
	к: 'k', κ: 'k',
	м: 'm',
	η: 'n',
	о: 'o', ο: 'o', σ: 'o',
	р: 'p', ρ: 'p',
	г: 'r',
	ѕ: 's',
	т: 't', τ: 't',
	υ: 'u',
	х: 'x', χ: 'x',
	у: 'y', γ: 'y'
};

// swap any non-ascii char for its lookalike ascii letter (case-insensitive)
const foldHomoglyphs = (value: string) =>
	value.replace(/[^\x00-\x7f]/g, (ch) => HOMOGLYPHS[ch] ?? HOMOGLYPHS[ch.toLowerCase()] ?? ch);

// undo homoglyphs + letter->symbol swaps so "nіgga" / "n1gg3r" / "f@ggot" all get caught
const deLeet = (value: string) =>
	foldHomoglyphs(value)
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '') // strip accents
		.toLowerCase()
		.replace(/0/g, 'o')
		.replace(/@/g, 'a') // @ is almost always standing in for 'a' (f@ggot)
		.replace(/[1!|]/g, 'i')
		.replace(/3/g, 'e')
		.replace(/4/g, 'a')
		.replace(/[5$]/g, 's')
		.replace(/7/g, 't');

// slurs safe to match anywhere, even spaced out like "n i g g a". heads up: this
// also trips rare words like "snigger"/"niggardly" — fine tradeoff for a guestbook
const SLURS_ANYWHERE = ['nigger', 'nigga', 'faggot', 'tranny', 'wetback', 'beaner'];
// slurs that also hide inside innocent words (spic->suspicious, coon->raccoon),
// so these only count when they're a whole word on their own
const SLURS_WORD_ONLY = ['kike', 'chink', 'spic', 'coon', 'gook', 'fag', 'paki', 'dyke', 'retard'];

const containsSlur = (name: string, message: string) => {
	const text = deLeet(`${name} ${message}`);
	const compact = text.replace(/[^a-z]/g, ''); // letters only, catches spaced-out dodges
	if (SLURS_ANYWHERE.some((slur) => compact.includes(slur))) return true;

	// whole-word check for the ambiguous ones (also catches simple plurals)
	return text.split(/[^a-z]+/).some((word) => {
		if (!word) return false;
		const singular = word.replace(/s$/, '');
		return SLURS_WORD_ONLY.includes(word) || SLURS_WORD_ONLY.includes(singular);
	});
};

// anti-spam: how many seconds you still have to wait before posting again,
// based on the last post from this name/ip/fingerprint. null = you're good
const checkRecentByField = async (db: D1Database, field: 'name' | 'ip_address' | 'fingerprint', value: string) => {
	if (!value) return null;

	const latestResult = await db
		.prepare(`SELECT created_at FROM guestbook WHERE ${field} = ? ORDER BY created_at DESC LIMIT 1`)
		.bind(value)
		.first<{ created_at: string }>();
	if (!latestResult?.created_at) return null;

	const lastPostTimestamp = new Date(`${latestResult.created_at.replace(' ', 'T')}Z`).getTime();
	if (Number.isNaN(lastPostTimestamp)) return null;

	const secondsSinceLastPost = (Date.now() - lastPostTimestamp) / 1000;
	if (secondsSinceLastPost < COOLDOWN_SECONDS) {
		return Math.ceil(COOLDOWN_SECONDS - secondsSinceLastPost);
	}

	return null;
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const env = platform?.env as Env | undefined;
		const db = env?.DB;
		if (!db) {
			return json({ error: 'Database not available.' }, 500);
		}

		await ensureGuestbookSchema(db);

		const formData = await request.formData();
		const name = normalizeInput(formData.get('name')?.toString() ?? '');
		const message = normalizeInput(formData.get('message')?.toString() ?? '');
		const fingerprint = normalizeFingerprint(formData.get('fingerprint')?.toString() ?? '');
		const ipAddress = getClientIp(request);
		const userAgent = normalizeUserAgent(request.headers.get('user-agent') ?? '');

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

		const ban = await getMatchingBan(db, ipAddress, fingerprint);
		if (ban) {
			return json({ error: ban.reason || 'This client is banned from posting in the guestbook.' }, 403);
		}

		if (containsSlur(name, message)) {
			return json({ error: 'Nuh uh, bad person!' }, 400);
		}

		const waitByName = await checkRecentByField(db, 'name', name);
		const waitByIp = await checkRecentByField(db, 'ip_address', ipAddress);
		const waitByFingerprint = await checkRecentByField(db, 'fingerprint', fingerprint);
		const waitFor = Math.max(waitByName ?? 0, waitByIp ?? 0, waitByFingerprint ?? 0);

		if (waitFor > 0) {
			return json(
				{
					error: `Slow down a bit. Please wait ${waitFor}s before posting again.`
				},
				429
			);
		}

		const result = await db
			.prepare('INSERT INTO guestbook (name, message, ip_address, user_agent, fingerprint) VALUES (?, ?, ?, ?, ?)')
			.bind(name, message, ipAddress || null, userAgent || null, fingerprint || null)
			.run();

		if (!result.success) {
			return json({ error: 'Failed to save entry. Please try again.' }, 500);
		}

		const insertedEntry = await db
			.prepare('SELECT id, name, message, created_at FROM guestbook WHERE id = ? LIMIT 1')
			.bind(result.meta?.last_row_id ?? -1)
			.first<{ id: number; name: string; message: string; created_at: string }>();

		try {
			await writeGuestbookAuditLog(env?.GUESTBOOK_LOGS, {
				action: 'guestbook_post',
				entry_id: result.meta?.last_row_id ?? null,
				name,
				ip_address: ipAddress || null,
				fingerprint: fingerprint || null,
				user_agent: userAgent || null,
				created_at: new Date().toISOString()
			});
		} catch (logError) {
			console.error('Failed to write guestbook log to R2:', logError);
		}

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

		await ensureGuestbookSchema(db);

		const result = await db
			.prepare('SELECT id, name, message, created_at FROM guestbook ORDER BY created_at DESC LIMIT 50')
			.all();

		return json({ entries: result.results || [] });
	} catch (error) {
		console.error('Error fetching guestbook entries:', error);
		return json({ error: 'Failed to fetch entries.' }, 500);
	}
};
