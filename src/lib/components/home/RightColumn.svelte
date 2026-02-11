<script lang="ts">
  import SystemCard from "$lib/components/SystemCard.svelte";
  import SystemStatus from "$lib/components/SystemStatus.svelte";
  import { allSystemSpecs } from "$lib/data/systemSpecs";

  let openSystemIndex: number | null = $state(null);
</script>

<div class="column-right">
  <section class="landing-section system-specs-section">
    {#each allSystemSpecs as system, index}
      <SystemCard
        {system}
        isOpen={openSystemIndex === index}
        onToggle={() => (openSystemIndex = openSystemIndex === index ? null : index)}
      />
    {/each}
  </section>

  <section class="landing-section system-status-section" class:hidden={openSystemIndex !== null}>
    <h2 class="landing-section-title">System Status</h2>
    <SystemStatus />
  </section>
</div>
