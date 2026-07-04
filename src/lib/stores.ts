import { writable } from 'svelte/store';

// little writable that remembers itself in localStorage
function persisted(key: string, initial: boolean) {
	const store = writable(initial);
	if (typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem(key);
			if (saved !== null) store.set(saved === '1');
		} catch {
			// localStorage can throw in private mode, whatever
		}
		store.subscribe((v) => {
			try {
				localStorage.setItem(key, v ? '1' : '0');
			} catch {
				// same deal
			}
		});
	}
	return store;
}

// the meteor overlay. on by default everywhere; `enabled` is the on/off you set
// from the terminal (and it's remembered), `forced` is flipped on by the 404 page
export const starfallEnabled = persisted('starfall', true);
export const starfallForced = writable(false);
