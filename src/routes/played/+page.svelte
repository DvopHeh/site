<script lang="ts">
	import { onMount } from 'svelte';

	interface PlayedTrack {
		title: string | null;
		artist: string | null;
		album: string | null;
		albumArt: string | null;
		source: string | null;
		player: string | null;
		playedAt: string;
	}

	interface PlayedPayload {
		generatedAt: string;
		count: number;
		tracks: PlayedTrack[];
	}

	let { data } = $props<{ data: { initialPlayed: PlayedPayload | null } }>();
	let played = $state<PlayedPayload | null>(null);
	let loading = $state(false);
	let error = $state('');

	const REFRESH_INTERVAL_MS = 5000;

	$effect(() => {
		if (played == null) {
			played = data.initialPlayed;
		}
	});

	function formatDate(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Unknown';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	async function refreshPlayed() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/played?limit=30');
			if (!response.ok) {
				error = `Failed to load played tracks (${response.status})`;
				return;
			}
			played = await response.json();
		} catch {
			error = 'Network error while loading played tracks.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const interval = setInterval(() => {
			void refreshPlayed();
		}, REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	});
</script>

<div class="played-page">
	<div class="played-header">
		<h1 class="landing-title">Recently Played</h1>
		<button class="played-refresh-btn" onclick={refreshPlayed} disabled={loading}>
			{loading ? 'Refreshing...' : 'Refresh now'}
		</button>
	</div>

	{#if error}
		<div class="played-error">{error}</div>
	{/if}

	{#if played && played.tracks.length > 0}
		<div class="played-grid">
			{#each played.tracks as track}
				<div class="played-card">
					{#if track.albumArt?.startsWith('http')}
						<img src={track.albumArt} alt="" loading="lazy" decoding="async" />
					{/if}
					<div class="played-content">
						<div class="played-title">{track.title ?? 'Unknown Track'}</div>
						<div class="played-artist">{track.artist ?? 'Unknown Artist'}</div>
						<div class="played-album">{track.album ?? 'Unknown Album'}</div>
						<div class="played-meta">
							<span>{formatDate(track.playedAt)}</span>
							{#if track.source}
								<span>• {track.source}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="played-empty">No played tracks captured yet.</div>
	{/if}
</div>

<style>
	.played-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.played-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.played-refresh-btn {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-alt);
		color: var(--color-text);
		cursor: pointer;
	}

	.played-refresh-btn:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.played-error {
		padding: 0.75rem;
		border-radius: 8px;
		background: rgba(255, 0, 0, 0.15);
		border: 1px solid rgba(255, 0, 0, 0.3);
		color: #ff7a7a;
		margin-bottom: 1rem;
	}

	.played-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.8rem;
	}

	.played-card {
		display: flex;
		gap: 0.8rem;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 0.75rem;
		box-shadow: 0 2px 8px 0 rgb(70, 0, 90);
	}

	.played-card img {
		width: 64px;
		height: 64px;
		object-fit: cover;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.played-content {
		min-width: 0;
	}

	.played-title {
		font-weight: 700;
	}

	.played-artist,
	.played-album,
	.played-meta {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.played-empty {
		color: var(--color-text-muted);
	}

	@media (max-width: 1200px) {
		.played-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 900px) {
		.played-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 600px) {
		.played-page {
			padding: 1rem;
		}

		.played-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
