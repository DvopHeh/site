<script lang="ts">
	import { onMount } from 'svelte';

	interface GuestbookEntry {
		id: number;
		name: string;
		message: string;
		created_at: string;
	}

	let entries: GuestbookEntry[] = $state([]);
	let loading = $state(true);
	let errorMessage = $state('');

	function formatDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return 'Unknown date';
		}
	}

	function formatRelativeDate(dateString: string): string {
		const timestamp = new Date(dateString).getTime();
		if (Number.isNaN(timestamp)) return '';

		const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
		if (diffSeconds < 60) return 'just now';
		if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
		if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
		if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
		return '';
	}

	async function loadEntries() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/guestbook');
			if (response.ok) {
				const data = await response.json();
				entries = data.entries || [];
			} else {
				errorMessage = 'Failed to load guestbook entries.';
			}
		} catch (e) {
			console.error('Error fetching entries:', e);
			errorMessage = 'Network error while loading entries.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadEntries();

		const handleRefresh = () => {
			void loadEntries();
		};
		window.addEventListener('guestbook:refresh', handleRefresh);

		return () => {
			window.removeEventListener('guestbook:refresh', handleRefresh);
		};
	});
</script>

<div class="guestbook">
	<div class="entries">
		{#if loading}
			<p class="no-entries">Loading entries...</p>
		{:else if errorMessage}
			<p class="error">{errorMessage}</p>
		{:else if entries.length === 0}
			<p class="no-entries">No entries yet. Be the first to sign!</p>
		{:else}
			{#each entries as entry}
				<div class="entry">
					<div class="entry-header">
						<strong class="entry-name">{entry.name}</strong>
						<span class="entry-date" title={formatDate(entry.created_at)}>
							{formatRelativeDate(entry.created_at) || formatDate(entry.created_at)}
						</span>
					</div>
					<div class="entry-message">{entry.message}</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
