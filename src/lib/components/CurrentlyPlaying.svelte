<script lang="ts">
	import { onMount } from 'svelte';

	interface Track {
		name: string;
		artist: string;
		album: string;
		image: string;
		url: string;
		nowPlaying: boolean;
		playedAt: string | null;
	}

	let currentTrack: Track | null = $state(null);
	let error = $state(false);

	async function fetchCurrentTrack() {
		try {
			const response = await fetch('/api/lastfm');
			if (!response.ok) {
				error = true;
				return;
			}
			const data = await response.json();
			if (data.tracks && Array.isArray(data.tracks)) {
				currentTrack = data.tracks.find((t: Track) => t.nowPlaying) || null;
			} else {
				error = true;
			}
		} catch (e) {
			console.error('Fetch error:', e);
			error = true;
		}
	}

	onMount(() => {
		fetchCurrentTrack();
		const interval = setInterval(fetchCurrentTrack, 30000);
		
		const handleVisibility = () => {
			if (!document.hidden) {
				fetchCurrentTrack();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

<div class="currently-playing">
	{#if error}
		<p class="error">Unable to load current track</p>
	{:else if currentTrack}
		<div class="current-track">
			{#if currentTrack.image}
				<img src={currentTrack.image} alt="" class="current-track-image" />
			{/if}
			<div class="current-track-info">
				<a href={currentTrack.url} target="_blank" class="current-track-name">{currentTrack.name}</a>
				<div class="current-track-artist">{currentTrack.artist}</div>
				<div class="current-track-status">♪ Now playing</div>
			</div>
		</div>
	{:else}
		<div class="current-track">
			<div class="current-track-info">
				<div class="current-track-name">Not currently playing</div>
				<div class="current-track-artist">No active music session</div>
				<div class="current-track-status">♪ Offline</div>
			</div>
		</div>
	{/if}
</div>
