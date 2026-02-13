import type { RequestHandler } from './$types';
import { getRecentPlayedTracks } from '$lib/server/playedHistory';

export const GET: RequestHandler = async ({ url, platform }) => {
	const limit = Number.parseInt(url.searchParams.get('limit') ?? '30', 10);
	const history = await getRecentPlayedTracks(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 30) : 30, platform?.env?.DB);

	return new Response(
		JSON.stringify({
			generatedAt: new Date().toISOString(),
			count: history.length,
			tracks: history
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		}
	);
};
