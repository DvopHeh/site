import type { RequestHandler } from './$types';
import { env as privateEnv } from '$env/dynamic/private';
import { recordPlayedTrack } from '$lib/server/playedHistory';

interface Track {
	playing: boolean;
	title: string | null;
	artist: string | null;
	album: string | null;
	albumArt: string | null;
	position: number | null;
	duration: number | null;
	estimatedPosition: number | null;
	source: string | null;
	player: string | null;
}

const NOW_PLAYING_URL = 'https://api-np.dvop.fyi/api/now-playing';
const MB_API_BASE = 'https://musicbrainz.org/ws/2';
const CAA_API_BASE = 'https://coverartarchive.org/release';
const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const DEEZER_SEARCH_API = 'https://api.deezer.com/search';
const USER_AGENT = 'dvop-site/1.0 (guestbook/blog site)';
const COVER_TTL_MS = 1000 * 60 * 60 * 6;
const NEGATIVE_TTL_MS = 1000 * 60;
const NOW_PLAYING_CACHE_MS = 200;

const coverCache = new Map<string, { url: string | null; expiresAt: number }>();
let nowPlayingCache: { track: Track; expiresAt: number } | null = null;

interface EnvBindings {
	LASTFM_API_KEY?: string;
	DB?: D1Database;
}

const isValidHttpUrl = (value: string | null | undefined) =>
	typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));

function cacheKey(track: Track): string | null {
	if (!track.artist) return null;
	const albumOrTitle = track.album ?? track.title;
	if (!albumOrTitle) return null;
	return `${track.artist.toLowerCase().trim()}::${albumOrTitle.toLowerCase().trim()}`;
}

async function fetchNowPlayingCached(): Promise<Track | null> {
	if (nowPlayingCache && nowPlayingCache.expiresAt > Date.now()) {
		return { ...nowPlayingCache.track };
	}

	const response = await fetch(NOW_PLAYING_URL, { cache: 'no-store' });
	if (!response.ok) return null;

	const track = (await response.json()) as Track;
	nowPlayingCache = {
		track,
		expiresAt: Date.now() + NOW_PLAYING_CACHE_MS
	};
	return { ...track };
}

async function findReleaseMbid(artist: string, album: string): Promise<string | null> {
	const query = `artist:"${artist}" AND release:"${album}"`;
	const searchUrl = `${MB_API_BASE}/release?query=${encodeURIComponent(query)}&fmt=json&limit=8`;
	const response = await fetch(searchUrl, {
		headers: {
			'User-Agent': USER_AGENT,
			Accept: 'application/json'
		}
	});
	if (!response.ok) return null;

	const data = (await response.json()) as { releases?: Array<{ id?: string }> };
	const releaseIds = data.releases?.map((release) => release.id).filter((id): id is string => Boolean(id)) ?? [];
	for (const releaseId of releaseIds) {
		const cover = await findCoverArtUrl(releaseId);
		if (cover) return cover;
	}

	return null;
}

async function findCoverArtUrl(releaseMbid: string): Promise<string | null> {
	const response = await fetch(`${CAA_API_BASE}/${releaseMbid}`, {
		headers: {
			'User-Agent': USER_AGENT,
			Accept: 'application/json'
		}
	});
	if (!response.ok) return null;

	const data = (await response.json()) as {
		images?: Array<{
			front?: boolean;
			image?: string;
			thumbnails?: { large?: string; small?: string };
		}>;
	};

	const front = data.images?.find((img) => img.front) ?? data.images?.[0];
	if (!front) return null;
	return front.image ?? front.thumbnails?.large ?? front.thumbnails?.small ?? null;
}

function normalizeText(value: string | null | undefined): string {
	return (value ?? '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s]/g, '')
		.replace(/\s+/g, ' ');
}

function scoreFieldMatch(actual: string, expected: string): number {
	if (!actual || !expected) return 0;
	if (actual === expected) return 100;
	if (actual.includes(expected) || expected.includes(actual)) return 70;

	const actualTokens = new Set(actual.split(' ').filter(Boolean));
	const expectedTokens = expected.split(' ').filter(Boolean);
	if (expectedTokens.length === 0) return 0;

	let overlap = 0;
	for (const token of expectedTokens) {
		if (actualTokens.has(token)) overlap += 1;
	}
	return Math.round((overlap / expectedTokens.length) * 50);
}

async function findDeezerCover(track: Track): Promise<string | null> {
	if (!track.artist || !track.title) return null;

	const search = async (query: string) => {
		const url = `${DEEZER_SEARCH_API}?q=${encodeURIComponent(query)}&limit=20`;
		const response = await fetch(url, {
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'application/json'
			}
		});
		if (!response.ok) return [];

		const data = (await response.json()) as {
			data?: Array<{
				title?: string;
				artist?: { name?: string };
				album?: {
					title?: string;
					cover_xl?: string;
					cover_big?: string;
					cover_medium?: string;
					cover_small?: string;
				};
			}>;
		};
		return data.data ?? [];
	};

	const wantedArtist = normalizeText(track.artist);
	const wantedAlbum = normalizeText(track.album);
	const wantedTitle = normalizeText(track.title);

	const strongCandidates = await search(`artist:"${track.artist}" track:"${track.title}"`);
	const albumCandidates = track.album ? await search(`artist:"${track.artist}" album:"${track.album}"`) : [];
	const looseCandidates = await search(`${track.artist} ${track.title}`);
	const candidates = [...strongCandidates, ...albumCandidates, ...looseCandidates];

	let bestScore = -1;
	let bestItem: (typeof candidates)[number] | null = null;

	for (const item of candidates) {
		const artist = normalizeText(item.artist?.name);
		const album = normalizeText(item.album?.title);
		const title = normalizeText(item.title);

		const artistScore = scoreFieldMatch(artist, wantedArtist);
		if (artistScore < 40) continue;
		const titleScore = scoreFieldMatch(title, wantedTitle);
		const albumScore = scoreFieldMatch(album, wantedAlbum);
		if (wantedAlbum && albumScore < 35 && titleScore < 90) continue;

		const score =
			artistScore * 0.45 +
			titleScore * 0.2 +
			albumScore * 0.35;

		if (score > bestScore) {
			bestScore = score;
			bestItem = item;
		}
	}

	const fallbackCandidate = strongCandidates[0] ?? albumCandidates[0] ?? looseCandidates[0] ?? null;
	const artwork =
		bestItem?.album?.cover_xl ??
		bestItem?.album?.cover_big ??
		bestItem?.album?.cover_medium ??
		bestItem?.album?.cover_small ??
		fallbackCandidate?.album?.cover_xl ??
		fallbackCandidate?.album?.cover_big ??
		fallbackCandidate?.album?.cover_medium ??
		fallbackCandidate?.album?.cover_small ??
		null;

	return artwork;
}

function getLastFmApiKey(platform: App.Platform | undefined): string | null {
	const platformEnv = platform?.env as EnvBindings | undefined;
	return platformEnv?.LASTFM_API_KEY ?? privateEnv.LASTFM_API_KEY ?? null;
}

function getBestLastFmImage(images: Array<{ '#text'?: string; size?: string }> | undefined): string | null {
	if (!images || images.length === 0) return null;
	const preferredOrder = ['mega', 'extralarge', 'large', 'medium', 'small'];

	for (const size of preferredOrder) {
		const hit = images.find((img) => img.size === size && img['#text']);
		if (hit?.['#text']) return hit['#text'];
	}

	return images.find((img) => img['#text'])?.['#text'] ?? null;
}

async function findLastFmCover(track: Track, apiKey: string | null): Promise<string | null> {
	if (!apiKey || !track.artist) return null;

	const tryAlbumLookup = async () => {
		if (!track.album) return null;

		const params = new URLSearchParams({
			method: 'album.getInfo',
			api_key: apiKey,
			artist: track.artist ?? '',
			album: track.album,
			autocorrect: '1',
			format: 'json'
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
		});
		if (!response.ok) return null;

		const data = (await response.json()) as {
			album?: { image?: Array<{ '#text'?: string; size?: string }> };
		};

		return getBestLastFmImage(data.album?.image);
	};

	const tryTrackLookup = async () => {
		if (!track.title) return null;

		const params = new URLSearchParams({
			method: 'track.getInfo',
			api_key: apiKey,
			artist: track.artist ?? '',
			track: track.title,
			autocorrect: '1',
			format: 'json'
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
		});
		if (!response.ok) return null;

		const data = (await response.json()) as {
			track?: { album?: { image?: Array<{ '#text'?: string; size?: string }> } };
		};

		return getBestLastFmImage(data.track?.album?.image);
	};

	try {
		return (await tryAlbumLookup()) ?? (await tryTrackLookup());
	} catch {
		return null;
	}
}

async function resolveFallbackCover(track: Track, apiKey: string | null): Promise<string | null> {
	const key = cacheKey(track);
	if (!key || !track.artist) return null;

	const cached = coverCache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.url;
	}

	let coverUrl: string | null = null;
	try {
		if (!coverUrl) {
			coverUrl = await findLastFmCover(track, apiKey);
		}
		if (!coverUrl && track.album) {
			coverUrl = await findReleaseMbid(track.artist, track.album);
		}
		if (!coverUrl) {
			coverUrl = await findDeezerCover(track);
		}
	} catch {
		coverUrl = null;
	}

	coverCache.set(key, {
		url: coverUrl,
		expiresAt: Date.now() + (coverUrl ? COVER_TTL_MS : NEGATIVE_TTL_MS)
	});

	return coverUrl;
}

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const lastFmApiKey = getLastFmApiKey(platform);
		const env = platform?.env as EnvBindings | undefined;
		const track = await fetchNowPlayingCached();
		if (!track) {
			return new Response(
				JSON.stringify({ error: 'Unable to load current track' }),
				{ status: 502, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (track.playing && !isValidHttpUrl(track.albumArt)) {
			const fallback = await resolveFallbackCover(track, lastFmApiKey);
			if (fallback) {
				track.albumArt = fallback;
			}
		}

		if (track.playing) {
			await recordPlayedTrack({
				title: track.title,
				artist: track.artist,
				album: track.album,
				albumArt: track.albumArt,
				source: track.source,
				player: track.player
			}, env?.DB);
		}

		return new Response(JSON.stringify(track), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
			}
		});
	} catch {
		return new Response(
			JSON.stringify({ error: 'Unable to load current track' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
