import type { RequestHandler } from './$types';

interface Env {
	LASTFM_API_KEY?: string;
}

interface LastFmTrack {
	name: string;
	artist: { '#text': string };
	album: { '#text': string };
	image: { '#text': string; size: string }[];
	url: string;
	'@attr'?: { nowplaying: string };
	date?: { uts: string };
}

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env as Env | undefined;
	const apiKey = env?.LASTFM_API_KEY || process.env.LASTFM_API_KEY;
	const username = 'Dvopp';
	
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API key not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	
	try {
		const response = await fetch(
			`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=5`
		);
		
		if (!response.ok) {
			throw new Error('Last.fm API error');
		}
		
		const data = await response.json();
		const tracks = data.recenttracks?.track || [];
		
		const formattedTracks = tracks.map((track: LastFmTrack) => ({
			name: track.name,
			artist: track.artist['#text'],
			album: track.album['#text'],
			image: track.image?.find((img: { size: string }) => img.size === 'large')?.['#text'] || '',
			url: track.url,
			nowPlaying: track['@attr']?.nowplaying === 'true',
			playedAt: track.date?.uts ? new Date(parseInt(track.date.uts) * 1000).toISOString() : null
		}));
		
		return new Response(JSON.stringify({ tracks: formattedTracks }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Last.fm API error:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch tracks' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
