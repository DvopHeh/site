<script lang="ts">
	import { onMount } from 'svelte';

	interface GuestbookEntry {
		id: number;
		name: string;
		message: string;
		created_at: string;
	}

	let entries: GuestbookEntry[] = $state([]);

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

	onMount(async () => {
		try {
			const response = await fetch('/api/guestbook');
			if (response.ok) {
				const data = await response.json();
				entries = data.entries || [];
			}
		} catch (e) {
			console.error('Error fetching entries:', e);
		}
	});
</script>

<div class="guestbook">
	<div class="entries">
		{#if entries.length === 0}
			<p class="no-entries">No entries yet. Be the first to sign!</p>
		{:else}
			{#each entries as entry}
				<div class="entry">
					<div class="entry-header">
						<strong class="entry-name">{entry.name}</strong>
						<span class="entry-date">{formatDate(entry.created_at)}</span>
					</div>
					<div class="entry-message">{entry.message}</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
