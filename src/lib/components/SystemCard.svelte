<script lang="ts">
  import type { SystemDetails, MonitorDetail } from "$lib/data/systemSpecs";

  let {
    system,
    isOpen = false,
    onToggle,
  }: {
    system: SystemDetails;
    isOpen?: boolean;
    onToggle?: () => void;
  } = $props();

  function handleToggle() {
    if (onToggle) {
      onToggle();
    }
  }

  function isMonitorArray(
    value: string | MonitorDetail[],
  ): value is MonitorDetail[] {
    return Array.isArray(value);
  }
</script>

<div class="system-card">
  <div class="system-card-header">
    <span class="system-card-title">{system.name}</span>
    <button class="system-card-toggle" onclick={handleToggle}>
      {isOpen ? "▼" : "▶"}
    </button>
  </div>

  {#if isOpen}
    {#if system.description}
      <p class="system-card-description">{system.description}</p>
    {/if}

    <div class="system-card-specs">
      {#if system.specs}
        {#each system.specs as spec}
          <div class="system-card-spec">
            <span class="system-card-spec-label">{spec.label}</span>
            <span class="system-card-spec-value">
              {#if spec.link}
                <a href={spec.link} target="_blank">{spec.value}</a>
              {:else}
                {spec.value}
              {/if}
              {#if spec.notes}
                <br /><small>({spec.notes})</small>
              {/if}
            </span>
          </div>
        {/each}
      {/if}

      {#if system.peripherals}
        {#each system.peripherals as peripheral}
          <div class="system-card-spec">
            <span class="system-card-spec-label">{peripheral.label}</span>
            <span class="system-card-spec-value">
              {#if isMonitorArray(peripheral.value)}
                {#each peripheral.value as monitor}
                  <div>
                    {#if monitor.link}
                      <a href={monitor.link} target="_blank">{monitor.model}</a>
                    {:else}
                      {monitor.model}
                    {/if}
                    {#if monitor.role}
                      ({monitor.role}){/if}
                    {#if monitor.size}
                      - {monitor.size}{/if}
                    {#if monitor.refreshRate}
                      @ {monitor.refreshRate}{/if}
                  </div>
                {/each}
              {:else if peripheral.link}
                <a href={peripheral.link} target="_blank">{peripheral.value}</a>
              {:else}
                {peripheral.value}
              {/if}
            </span>
          </div>
        {/each}
      {/if}

      {#if system.accessories}
        {#each system.accessories as accessory}
          <div class="system-card-spec">
            <span class="system-card-spec-label">{accessory.label}</span>
            <span class="system-card-spec-value">
              {#if accessory.link}
                <a href={accessory.link} target="_blank">{accessory.value}</a>
              {:else}
                {accessory.value}
              {/if}
              {#if accessory.notes}
                <br /><small>({accessory.notes})</small>
              {/if}
            </span>
          </div>
        {/each}
      {/if}

      {#if system.softwareAndOS}
        {#each system.softwareAndOS as software}
          <div class="system-card-spec">
            <span class="system-card-spec-label">{software.label}</span>
            <span class="system-card-spec-value">
              {software.value}
              {#if software.notes}
                <br /><small>({software.notes})</small>
              {/if}
            </span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
