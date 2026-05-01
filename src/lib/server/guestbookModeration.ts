export type BanType = 'ip' | 'fingerprint';

export interface GuestbookBan {
	id: number;
	type: BanType;
	value: string;
	reason: string | null;
	created_at: string;
}

const IP_MAX_LENGTH = 64;
const FINGERPRINT_MAX_LENGTH = 128;
const USER_AGENT_MAX_LENGTH = 255;

const IP_PATTERN = /^[a-fA-F0-9:.]+$/;
const FINGERPRINT_PATTERN = /^[a-zA-Z0-9_-]+$/;

let schemaReady = false;

export const normalizeIp = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > IP_MAX_LENGTH || !IP_PATTERN.test(trimmed)) {
		return '';
	}
	return trimmed;
};

export const normalizeFingerprint = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > FINGERPRINT_MAX_LENGTH || !FINGERPRINT_PATTERN.test(trimmed)) {
		return '';
	}
	return trimmed;
};

export const normalizeUserAgent = (value: string) => value.trim().slice(0, USER_AGENT_MAX_LENGTH);

export const getClientIp = (request: Request) => {
	const cfIp = normalizeIp(request.headers.get('CF-Connecting-IP') ?? '');
	if (cfIp) return cfIp;

	const xForwardedFor = request.headers.get('X-Forwarded-For') ?? '';
	const firstForwarded = xForwardedFor.split(',')[0] ?? '';
	return normalizeIp(firstForwarded);
};

const addColumnIfMissing = async (db: D1Database, table: string, columnDef: string) => {
	try {
		await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
	} catch {
		// No-op. D1 throws if the column already exists.
	}
};

export const ensureGuestbookSchema = async (db: D1Database) => {
	if (schemaReady) return;

	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS guestbook (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				message TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				ip_address TEXT,
				user_agent TEXT,
				fingerprint TEXT
			)
		`)
		.run();

	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS guestbook_bans (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				type TEXT NOT NULL CHECK(type IN ('ip', 'fingerprint')),
				value TEXT NOT NULL,
				reason TEXT,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				UNIQUE(type, value)
			)
		`)
		.run();

	await addColumnIfMissing(db, 'guestbook', 'ip_address TEXT');
	await addColumnIfMissing(db, 'guestbook', 'user_agent TEXT');
	await addColumnIfMissing(db, 'guestbook', 'fingerprint TEXT');

	schemaReady = true;
};

export const getMatchingBan = async (db: D1Database, ipAddress: string, fingerprint: string) => {
	if (!ipAddress && !fingerprint) return null;

	const result = await db
		.prepare(
			`SELECT id, type, value, reason, created_at
			 FROM guestbook_bans
			 WHERE (type = 'ip' AND value = ?)
			    OR (type = 'fingerprint' AND value = ?)
			 LIMIT 1`
		)
		.bind(ipAddress, fingerprint)
		.first<GuestbookBan>();

	return result;
};

export const writeGuestbookAuditLog = async (bucket: R2Bucket | undefined, payload: Record<string, unknown>) => {
	if (!bucket) return;

	const now = new Date();
	const dayPrefix = now.toISOString().slice(0, 10);
	const key = `guestbook/${dayPrefix}/${now.getTime()}-${crypto.randomUUID()}.json`;

	await bucket.put(key, JSON.stringify(payload), {
		httpMetadata: { contentType: 'application/json' }
	});
};
