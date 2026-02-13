import type { RequestHandler } from './$types';

type HealthState = 'ok' | 'degraded' | 'down' | 'skipped';

interface HealthCheckResult {
	id: string;
	name: string;
	state: HealthState;
	httpStatus: number | null;
	latencyMs: number | null;
	message: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const CHECK_TIMEOUT_MS = 4500;
const STATUS_HISTORY_WINDOW_MS = 1000 * 60 * 60 * 24;
const STATUS_HISTORY_MAX_POINTS = 240;
const LANYARD_DISCORD_ID = '410475909125242901';

interface StatusSnapshot {
	timestamp: string;
	ok: number;
	degraded: number;
	down: number;
	total: number;
}

const statusHistory: StatusSnapshot[] = [];
let statusTableEnsured = false;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
	try {
		return await fn(controller.signal);
	} finally {
		clearTimeout(timeout);
	}
}

function mapState(status: number, okStatuses: number[]): HealthState {
	if (okStatuses.includes(status)) return 'ok';
	if (status >= 500) return 'down';
	return 'degraded';
}

async function runHttpCheck(
	id: string,
	name: string,
	fn: (signal: AbortSignal) => Promise<Response>,
	okStatuses: number[]
): Promise<HealthCheckResult> {
	const startedAt = Date.now();
	try {
		const response = await withTimeout(fn);
		return {
			id,
			name,
			state: mapState(response.status, okStatuses),
			httpStatus: response.status,
			latencyMs: Date.now() - startedAt,
			message: response.ok || okStatuses.includes(response.status) ? 'Reachable' : `Unexpected status ${response.status}`
		};
	} catch (error) {
		const isAbort = error instanceof Error && error.name === 'AbortError';
		return {
			id,
			name,
			state: 'down',
			httpStatus: null,
			latencyMs: Date.now() - startedAt,
			message: isAbort ? 'Timed out' : 'Request failed'
		};
	}
}

async function ensureStatusTable(db: D1Database): Promise<void> {
	if (statusTableEnsured) return;

	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS status_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				ok INTEGER NOT NULL,
				degraded INTEGER NOT NULL,
				down INTEGER NOT NULL,
				total INTEGER NOT NULL
			)
		`)
		.run();
	await db
		.prepare(`CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON status_history(created_at DESC)`)
		.run();

	statusTableEnsured = true;
}

async function persistAndLoadStatusHistory(
	db: D1Database,
	snapshot: StatusSnapshot
): Promise<StatusSnapshot[]> {
	await ensureStatusTable(db);

	await db
		.prepare(`
			INSERT INTO status_history (created_at, ok, degraded, down, total)
			VALUES (datetime('now'), ?, ?, ?, ?)
		`)
		.bind(snapshot.ok, snapshot.degraded, snapshot.down, snapshot.total)
		.run();

	await db
		.prepare(`DELETE FROM status_history WHERE created_at < datetime('now', '-1 day')`)
		.run();

	await db
		.prepare(`
			DELETE FROM status_history
			WHERE id NOT IN (
				SELECT id FROM status_history ORDER BY created_at DESC, id DESC LIMIT ?
			)
		`)
		.bind(STATUS_HISTORY_MAX_POINTS)
		.run();

	const historyResult = await db
		.prepare(`
			SELECT created_at, ok, degraded, down, total
			FROM status_history
			ORDER BY created_at ASC, id ASC
			LIMIT ?
		`)
		.bind(STATUS_HISTORY_MAX_POINTS)
		.all<{ created_at: string; ok: number; degraded: number; down: number; total: number }>();

	return (historyResult.results ?? []).map((row) => ({
		timestamp: `${row.created_at.replace(' ', 'T')}Z`,
		ok: row.ok,
		degraded: row.degraded,
		down: row.down,
		total: row.total
	}));
}

export const GET: RequestHandler = async (event) => {
	const { fetch, platform } = event;
	const env = platform?.env;

	const checks: HealthCheckResult[] = await Promise.all([
		runHttpCheck('now-playing', 'Now Playing API', (signal) => fetch('/api/now-playing', { signal }), [200]),
		runHttpCheck('guestbook', 'Guestbook API', (signal) => fetch('/api/guestbook', { signal }), [200]),
		runHttpCheck('blog', 'Blog API', (signal) => fetch('/api/blog', { signal }), [200]),
		runHttpCheck(
			'lanyard',
			'Lanyard (dispull)',
			(signal) => fetch(`https://dispull.dvop.fyi/api/profile/${LANYARD_DISCORD_ID}`, { signal }),
			[200]
		),
		runHttpCheck('pc-stats', 'Main PC stats', (signal) => fetch('https://pc-stats.dvop.fyi', { signal }), [200]),
		runHttpCheck('server-stats', 'Server stats', (signal) => fetch('https://server-stats.dvop.fyi', { signal }), [200]),
		runHttpCheck(
			'auth',
			'Auth API',
			(signal) =>
				fetch('/api/auth', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ password: '__healthcheck__' }),
					signal
				}),
			[401, 200]
		),
		runHttpCheck('upload', 'Upload API', (signal) => fetch('/api/upload', { method: 'POST', body: new FormData(), signal }), [401, 400])
	]);

	const bindingChecks: HealthCheckResult[] = [
		{
			id: 'binding-db',
			name: 'Guestbook',
			state: env?.DB ? 'ok' : 'down',
			httpStatus: null,
			latencyMs: null,
			message: env?.DB ? 'Working' : 'Missing'
		},
		{
			id: 'binding-blog',
			name: 'Blog entries',
			state: env?.blog ? 'ok' : 'down',
			httpStatus: null,
			latencyMs: null,
			message: env?.blog ? 'Working' : 'Missing'
		},
		{
			id: 'binding-r2',
			name: 'Images',
			state: env?.['images-blog'] ? 'ok' : 'down',
			httpStatus: null,
			latencyMs: null,
			message: env?.['images-blog'] ? 'Working' : 'Missing'
		}
	];

	const allChecks = [...checks, ...bindingChecks];
	const summary = {
		ok: allChecks.filter((check) => check.state === 'ok').length,
		degraded: allChecks.filter((check) => check.state === 'degraded').length,
		down: allChecks.filter((check) => check.state === 'down').length,
		total: allChecks.length
	};

	const snapshot: StatusSnapshot = {
		timestamp: new Date().toISOString(),
		ok: summary.ok,
		degraded: summary.degraded,
		down: summary.down,
		total: summary.total
	};

	let history: StatusSnapshot[] = [];
	if (env?.DB) {
		try {
			history = await persistAndLoadStatusHistory(env.DB, snapshot);
		} catch {
			history = [];
		}
	}

	if (history.length === 0) {
		statusHistory.push(snapshot);

		const cutoff = Date.now() - STATUS_HISTORY_WINDOW_MS;
		while (statusHistory.length > 0) {
			const ts = new Date(statusHistory[0].timestamp).getTime();
			if (!Number.isNaN(ts) && ts >= cutoff) break;
			statusHistory.shift();
		}
		if (statusHistory.length > STATUS_HISTORY_MAX_POINTS) {
			statusHistory.splice(0, statusHistory.length - STATUS_HISTORY_MAX_POINTS);
		}
		history = [...statusHistory];
	}

	return json({
		generatedAt: new Date().toISOString(),
		summary,
		checks: allChecks,
		history
	});
};
