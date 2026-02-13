import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/status');
		if (!response.ok) {
			return {
				initialStatus: null
			};
		}

		return {
			initialStatus: await response.json()
		};
	} catch {
		return {
			initialStatus: null
		};
	}
};
