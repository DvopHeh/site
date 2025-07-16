import type { APIRoute } from 'astro';

interface Env {
  LASTFM_API_KEY: string;
  LASTFM_USERNAME: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  // Try multiple ways to get environment variables for different deployment scenarios
  const env = locals.runtime?.env as Env;
  let API_KEY = env?.LASTFM_API_KEY || import.meta.env.LASTFM_API_KEY;
  let USERNAME = env?.LASTFM_USERNAME || import.meta.env.LASTFM_USERNAME;
  
  // Fallback to process.env for local development
  if (!API_KEY && typeof process !== 'undefined') {
    API_KEY = process.env.LASTFM_API_KEY;
  }
  if (!USERNAME && typeof process !== 'undefined') {
    USERNAME = process.env.LASTFM_USERNAME;
  }

  if (!API_KEY || !USERNAME) {
    console.error('Missing env vars:', { API_KEY: !!API_KEY, USERNAME: !!USERNAME });
    return new Response(JSON.stringify({ error: 'Missing Last.fm API key or username' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tracks = data.recenttracks.track.map((track: any) => ({
      name: track.name,
      artist: track.artist['#text'],
      album: track.album['#text'],
      image: track.image.find((img: any) => img.size === 'medium')?.['#text'] || '',
      url: track.url,
      nowPlaying: track['@attr']?.nowplaying === 'true',
      playedAt: track.date ? new Date(parseInt(track.date.uts) * 1000).toISOString() : null
    }));

    return new Response(JSON.stringify({ tracks }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch Last.fm data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};