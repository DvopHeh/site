import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/played?limit=30');
		if (!response.ok) return { initialPlayed: null };
		return { initialPlayed: await response.json() };
	} catch {
		return { initialPlayed: null };
	}
};
