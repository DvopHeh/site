<script lang="ts">
  import { onMount } from "svelte";
  import MarqueeText from "./MarqueeText.svelte";

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
    volume: number | null;
  }

  let currentTrack: Track | null = $state(null);
  let error = $state(false);
  let displayPosition = $state(0);
  let isFetching = false;
  let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
  let positionTimer: ReturnType<typeof setInterval> | null = null;
  let syncedPosition = 0;
  let syncedAtMs = 0;
  let lastTrackId = "";

  const FETCH_INTERVAL_IDLE_MS = 2000;
  const FETCH_INTERVAL_PLAYING_MS = 500;
  const POSITION_TICK_MS = 500;

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

  function getSourceLabel(source: string | null | undefined): string | null {
    if (!source) return null;
    const normalized = source.toLowerCase();
    if (normalized === "linux") return "PC";
    if (normalized === "android") return "Phone";
    return null;
  }

  function getTrackSource(track: Track | null): string | null {
    return track?.source ?? null;
  }

  function getTrackId(track: Track): string {
    return [
      track.source ?? "",
      track.player ?? "",
      track.title ?? "",
      track.artist ?? "",
      track.album ?? "",
    ].join("|");
  }

  function getServerPosition(track: Track): number | null {
    if (track.playing && track.estimatedPosition != null) return track.estimatedPosition;
    if (track.position != null) return track.position;
    return null;
  }

  function getPredictedPosition(nowMs = Date.now()): number {
    if (!currentTrack?.playing) return syncedPosition;
    return syncedPosition + (nowMs - syncedAtMs) / 1000;
  }

  function syncPositionFromServer(track: Track) {
    const serverPos = getServerPosition(track);
    if (serverPos == null) return;

    const now = Date.now();
    const nextTrackId = getTrackId(track);
    const trackChanged = nextTrackId !== lastTrackId;
    lastTrackId = nextTrackId;

    if (trackChanged || !track.playing) {
      syncedPosition = serverPos;
      syncedAtMs = now;
      displayPosition = serverPos;
      return;
    }

    const localPredicted = getPredictedPosition(now);
    const drift = serverPos - localPredicted;
    if (Math.abs(drift) > 1.2) {
      syncedPosition = serverPos;
      syncedAtMs = now;
      displayPosition = serverPos;
    }
  }

  async function fetchCurrentTrack() {
    if (isFetching) return;
    isFetching = true;
    try {
      const response = await fetch("/api/now-playing", { cache: "no-store" });
      if (!response.ok) {
        error = true;
        return;
      }
      const data: Track = await response.json();
      currentTrack = data;
      syncPositionFromServer(data);
    } catch (e) {
      console.error("Fetch error:", e);
      error = true;
    } finally {
      isFetching = false;
    }
  }

  function getNextFetchDelay(): number {
    return currentTrack?.playing ? FETCH_INTERVAL_PLAYING_MS : FETCH_INTERVAL_IDLE_MS;
  }

  async function pollLoop() {
    if (document.hidden) return;
    await fetchCurrentTrack();
    fetchTimeout = setTimeout(() => {
      void pollLoop();
    }, getNextFetchDelay());
  }

  function startPolling() {
    if (fetchTimeout) return;
    void pollLoop();
  }

  function stopPolling() {
    if (!fetchTimeout) return;
    clearTimeout(fetchTimeout);
    fetchTimeout = null;
  }

  onMount(() => {
    startPolling();

    // Smooth local position counter between fetches
    positionTimer = setInterval(() => {
      if (currentTrack?.playing) {
        const next = getPredictedPosition();
        if (currentTrack.duration && currentTrack.duration > 0) {
          displayPosition = Math.min(next, currentTrack.duration);
        } else {
          displayPosition = next;
        }
      }
    }, POSITION_TICK_MS);

    const handleVisibility = () => {
      if (!document.hidden) {
        startPolling();
        void fetchCurrentTrack();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      if (positionTimer) clearInterval(positionTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  });

  let sourceLabel = $derived(getSourceLabel(getTrackSource(currentTrack)));
</script>

<div class="currently-playing">
  {#if error}
    <p class="error">Unable to load current track</p>
  {:else if currentTrack?.playing && currentTrack.title}
    <div class="current-track">
      <div class="current-track-main">
        {#if currentTrack.albumArt?.startsWith("http")}
          <img
            src={currentTrack.albumArt}
            alt=""
            class="current-track-image"
            loading="lazy"
            decoding="async"
          />
        {/if}
        <div class="current-track-info">
          <MarqueeText text={currentTrack.title} class="current-track-name" />
          <MarqueeText
            text={currentTrack.artist ?? "?"}
            class="current-track-artist"
          />
          <MarqueeText
            text={currentTrack.album ?? "?"}
            class="current-track-album"
          />
          <div class="current-track-status-row">
            <div class="current-track-status">
              {formatTime(displayPosition)} / {formatTime(currentTrack.duration)}
            </div>
            {#if currentTrack.volume != null}
              <div class="current-track-status">Vol {currentTrack.volume}%</div>
            {/if}
            {#if sourceLabel}
              <span class="current-track-source-badge">Played from: {sourceLabel}</span>
            {/if}
          </div>
        </div>
      </div>
      <div class="current-track-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercent()}%"></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="current-track">
      <div class="current-track-main">
        <div class="current-track-info">
          <div class="current-track-name" style="font-size: 1.15rem;">
            Not currently playing
          </div>
          <div class="current-track-artist" style="font-size: 1.05rem;">
            No active music session
          </div>
          <div class="current-track-status" style="font-size: 0.95rem;">
            ♪ Offline
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
