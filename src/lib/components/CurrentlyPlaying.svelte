<script lang="ts">
  import { onMount } from "svelte";

  interface Track {
    playing: boolean;
    title: string | null;
    artist: string | null;
    album: string | null;
    albumArt: string | null;
    position: number | null;
    duration: number | null;
    estimatedPosition: number | null;
    source: string | null;
    player: string | null;
  }

  let currentTrack: Track | null = $state(null);
  let error = $state(false);
  let displayPosition = $state(0);
  let positionTimer: ReturnType<typeof setInterval> | null = null;

  function formatTime(seconds: number | null | undefined): string {
    if (seconds == null || seconds < 0) return "?:??";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function progressPercent(): number {
    if (!currentTrack?.duration || currentTrack.duration <= 0) return 0;
    return Math.min((displayPosition / currentTrack.duration) * 100, 100);
  }

  async function fetchCurrentTrack() {
    try {
      const response = await fetch("https://api-np.dvop.fyi/api/now-playing");
      if (!response.ok) {
        error = true;
        return;
      }
      const data: Track = await response.json();
      currentTrack = data;

      if (data.playing && data.estimatedPosition != null) {
        displayPosition = data.estimatedPosition;
      } else if (data.position != null) {
        displayPosition = data.position;
      }
    } catch (e) {
      console.error("Fetch error:", e);
      error = true;
    }
  }

  onMount(() => {
    fetchCurrentTrack();
    const fetchInterval = setInterval(fetchCurrentTrack, 1000);

    // Smooth local position counter between fetches
    positionTimer = setInterval(() => {
      if (currentTrack?.playing) {
        displayPosition += 0.1;
      }
    }, 100);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchCurrentTrack();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(fetchInterval);
      if (positionTimer) clearInterval(positionTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  });
</script>

<div class="currently-playing">
  {#if error}
    <p class="error">Unable to load current track</p>
  {:else if currentTrack?.playing && currentTrack.title}
    <div class="current-track">
      <div class="current-track-main">
        {#if currentTrack.albumArt?.startsWith("http")}
          <img src={currentTrack.albumArt} alt="" class="current-track-image" />
        {/if}
        <div class="current-track-info">
          <div class="current-track-name">{currentTrack.title}</div>
          <div class="current-track-artist">{currentTrack.artist ?? "?"}</div>
          <div class="current-track-album">{currentTrack.album ?? "?"}</div>
          <div class="current-track-status">
            {formatTime(displayPosition)} / {formatTime(currentTrack.duration)}
          </div>
        </div>
      </div>
      <div class="current-track-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: {progressPercent()}%"
          ></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="current-track">
      <div class="current-track-main">
        <div class="current-track-info">
          <div class="current-track-name">Not currently playing</div>
          <div class="current-track-artist">No active music session</div>
          <div class="current-track-status">♪ Offline</div>
        </div>
      </div>
    </div>
  {/if}
</div>
