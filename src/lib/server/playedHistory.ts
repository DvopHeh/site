export interface PlayedTrack {
	title: string | null;
	artist: string | null;
	album: string | null;
	albumArt: string | null;
	source: string | null;
	player: string | null;
	playedAt: string;
}

const MAX_HISTORY_ITEMS = 50;
const playedHistory: PlayedTrack[] = [];
let playedTableEnsured = false;

function trackSignature(track: Omit<PlayedTrack, 'playedAt'>): string {
	return `${track.artist ?? ''}::${track.title ?? ''}::${track.album ?? ''}`.toLowerCase();
}

async function ensurePlayedTable(db: D1Database): Promise<void> {
	if (playedTableEnsured) return;

	await db
		.prepare(`
			CREATE TABLE IF NOT EXISTS played_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				signature TEXT NOT NULL,
				title TEXT,
				artist TEXT,
				album TEXT,
				album_art TEXT,
				source TEXT,
				player TEXT,
				played_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`)
		.run();
	await db
		.prepare(`CREATE INDEX IF NOT EXISTS idx_played_history_played_at ON played_history(played_at DESC)`)
		.run();

	playedTableEnsured = true;
}

export async function recordPlayedTrack(track: Omit<PlayedTrack, 'playedAt'>, db?: D1Database): Promise<void> {
	if (!track.title || !track.artist) return;

	const signature = trackSignature(track);

	if (db) {
		try {
			await ensurePlayedTable(db);

			const latest = await db
				.prepare('SELECT signature FROM played_history ORDER BY played_at DESC, id DESC LIMIT 1')
				.first<{ signature: string }>();
			if (latest?.signature === signature) {
				return;
			}

			await db
				.prepare(`
					INSERT INTO played_history (signature, title, artist, album, album_art, source, player, played_at)
					VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
				`)
				.bind(signature, track.title, track.artist, track.album, track.albumArt, track.source, track.player)
				.run();

			await db
				.prepare(`
					DELETE FROM played_history
					WHERE id NOT IN (
						SELECT id FROM played_history ORDER BY played_at DESC, id DESC LIMIT 500
					)
				`)
				.run();
			return;
		} catch {
			// Fall back to in-memory history if D1 is unavailable.
		}
	}

	const latest = playedHistory[0];
	if (latest && trackSignature(latest) === signature) {
		return;
	}

	playedHistory.unshift({
		...track,
		playedAt: new Date().toISOString()
	});

	if (playedHistory.length > MAX_HISTORY_ITEMS) {
		playedHistory.length = MAX_HISTORY_ITEMS;
	}
}

export async function getRecentPlayedTracks(limit = 10, db?: D1Database): Promise<PlayedTrack[]> {
	const safeLimit = Math.min(Math.max(limit, 1), MAX_HISTORY_ITEMS);

	if (db) {
		try {
			await ensurePlayedTable(db);
			const result = await db
				.prepare(`
					SELECT title, artist, album, album_art, source, player, played_at
					FROM played_history
					ORDER BY played_at DESC, id DESC
					LIMIT ?
				`)
				.bind(safeLimit)
				.all<{
					title: string | null;
					artist: string | null;
					album: string | null;
					album_art: string | null;
					source: string | null;
					player: string | null;
					played_at: string;
				}>();

			return (result.results ?? []).map((row) => ({
				title: row.title,
				artist: row.artist,
				album: row.album,
				albumArt: row.album_art,
				source: row.source,
				player: row.player,
				playedAt: row.played_at
			}));
		} catch {
			// Fall back to in-memory history if D1 is unavailable.
		}
	}

	return playedHistory.slice(0, safeLimit);
}
