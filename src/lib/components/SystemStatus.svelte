<script lang="ts">
  import { onMount } from "svelte";

  interface SystemStats {
    hostname: string;
    cpu: { usage: number; cores: number };
    ram: { total: number; used: number; percent: number };
    disks: Array<{
      name: string;
      mount: string;
      percent: number;
      used: string;
      total: string;
    }>;
    uptime: { seconds: number; formatted: string };
    temp: { cpu: number | null };
    gpus?: Array<{
      name: string;
      usage: number;
      temp: number | null;
      vendor: string;
    }>;
    gpu?: {
      // Legacy support
      name: string;
      usage: number;
      temp: number | null;
      vendor: string;
    } | null;
    os: string;
    kernel: string;
    timestamp: number;
  }

  const ENDPOINTS: Record<string, string> = {
    Server: "https://server-stats.dvop.fyi",
    "Main PC": "https://pc-stats.dvop.fyi",
  };

  let activeTab: string = $state("Server");
  let stats: Record<string, SystemStats | null> = $state({});
  let online: Record<string, boolean> = $state({});
  let loading: Record<string, boolean> = $state({});

  // Initialize states
  for (const key of Object.keys(ENDPOINTS)) {
    stats[key] = null;
    online[key] = false;
    loading[key] = true;
  }

  async function fetchStats(name: string) {
    try {
      const res = await fetch(ENDPOINTS[name], {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        stats[name] = await res.json();
        online[name] = true;
      } else {
        online[name] = false;
      }
    } catch {
      online[name] = false;
    } finally {
      loading[name] = false;
    }
  }

  function formatRam(mb: number): string {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  }

  function getBarColor(percent: number): string {
    if (percent < 50) return "var(--color-primary)";
    if (percent < 80) return "#f0a500";
    return "#e74c3c";
  }

  onMount(() => {
    // Initial fetch for all
    for (const name of Object.keys(ENDPOINTS)) {
      fetchStats(name);
    }

    // Poll every second
    const interval = setInterval(() => {
      for (const name of Object.keys(ENDPOINTS)) {
        fetchStats(name);
      }
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="system-status">
  <div class="status-tabs">
    {#each Object.keys(ENDPOINTS) as tab}
      <button
        class="status-tab"
        class:active={activeTab === tab}
        onclick={() => (activeTab = tab)}
      >
        <span
          class="status-dot"
          class:online={online[tab]}
          class:offline={!online[tab] && !loading[tab]}
        ></span>
        {tab}
      </button>
    {/each}
  </div>

  <div class="status-content">
    {#if loading[activeTab]}
      <div class="status-loading">
        <span class="status-spinner"></span>
        Connecting...
      </div>
    {:else if !online[activeTab]}
      <div class="status-offline">
        <span class="status-offline-dot"></span>
        <span>{activeTab} is offline</span>
      </div>
    {:else if stats[activeTab]}
      {@const s = stats[activeTab]!}
      {@const gpuList = s.gpus || (s.gpu ? [s.gpu] : [])}
      <div class="status-grid">
        <!-- CPU -->
        <div class="stat-row">
          <span class="stat-label">CPU</span>
          <div class="stat-bar-wrap">
            <div
              class="stat-bar"
              style="width: {s.cpu.usage}%; background: {getBarColor(
                s.cpu.usage,
              )}"
            ></div>
          </div>
          <span class="stat-value">{s.cpu.usage}%</span>
        </div>

        <!-- GPU (if available) -->
        <!-- GPUs -->
        <!-- GPUs -->
        {#each gpuList as gpu}
          <div class="stat-row">
            <span class="stat-label" title={gpu.name}
              >{gpu.vendor === "Nvidia" ? "GPU" : gpu.name}</span
            >
            <div class="stat-bar-wrap">
              <div
                class="stat-bar"
                style="width: {gpu.usage}%; background: {getBarColor(
                  gpu.usage,
                )}"
              ></div>
            </div>
            <span class="stat-value">{gpu.usage}%</span>
          </div>
        {/each}

        <!-- RAM -->
        <div class="stat-row">
          <span class="stat-label">RAM</span>
          <div class="stat-bar-wrap">
            <div
              class="stat-bar"
              style="width: {s.ram.percent}%; background: {getBarColor(
                s.ram.percent,
              )}"
            ></div>
          </div>
          <span class="stat-value">{s.ram.percent}%</span>
        </div>

        <!-- DISKS -->
        {#if s.disks && s.disks.length > 0}
          <div class="stat-header">Storage</div>
          {#each s.disks as disk}
            <div class="stat-row">
              <span class="stat-label" title={disk.name}>{disk.mount}</span>
              <div class="stat-bar-wrap">
                <div
                  class="stat-bar"
                  style="width: {disk.percent}%; background: {getBarColor(
                    disk.percent,
                  )}"
                ></div>
              </div>
              <span class="stat-value">{disk.percent}%</span>
            </div>
          {/each}
        {/if}

        <div class="stat-details">
          <div class="stat-detail">
            <span class="detail-label">Uptime</span>
            <span class="detail-value">{s.uptime.formatted}</span>
          </div>
          {#if s.temp.cpu !== null}
            <div class="stat-detail">
              <span class="detail-label">CPU Temp</span>
              <span class="detail-value">{s.temp.cpu}°C</span>
            </div>
          {/if}
          {#each gpuList as gpu}
            {#if gpu.temp !== null}
              <div class="stat-detail">
                <span class="detail-label"
                  >{gpu.vendor === "Nvidia" ? "GPU" : gpu.name} Temp</span
                >
                <span class="detail-value">{gpu.temp}°C</span>
              </div>
            {/if}
          {/each}
          <div class="stat-detail">
            <span class="detail-label">RAM</span>
            <span class="detail-value"
              >{formatRam(s.ram.used)} / {formatRam(s.ram.total)}</span
            >
          </div>
          <div class="stat-detail">
            <!-- Show details for the first/main disk or just generic if multiple -->
            <span class="detail-label">Kernel</span>
            <span class="detail-value">{s.kernel}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .system-status {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .status-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
  }

  .status-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-family: var(--font-main);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .status-tab:hover {
    color: var(--color-text);
    background: var(--color-surface-alt);
  }

  .status-tab.active {
    color: var(--color-primary);
    background: var(--color-surface-alt);
  }

  .status-tab.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-muted);
    transition: background 0.3s;
  }

  .status-dot.online {
    background: #2ecc71;
    box-shadow: 0 0 4px #2ecc71;
  }

  .status-dot.offline {
    background: #e74c3c;
    box-shadow: 0 0 4px #e74c3c;
  }

  .status-content {
    padding: 0.75rem;
  }

  .status-loading,
  .status-offline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .status-offline-dot {
    width: 8px;
    height: 8px;
    background: #e74c3c;
    border-radius: 50%;
  }

  .status-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-header {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--color-border);
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-label {
    width: 3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-bar-wrap {
    flex: 1;
    height: 8px;
    background: var(--color-surface-alt);
    border-radius: 4px;
    overflow: hidden;
  }

  .stat-bar {
    height: 100%;
    border-radius: 4px;
    transition:
      width 0.5s ease,
      background 0.5s ease;
    min-width: 2px;
  }

  .stat-value {
    width: 3rem;
    text-align: right;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .stat-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 0.75rem;
    margin-top: 0.25rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .stat-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .detail-value {
    font-size: 0.75rem;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

</style>
