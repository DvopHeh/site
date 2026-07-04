<script lang="ts">
  // right side of the homepage — my pc/server spec cards. track which one's
  // open so opening a new card closes the last
  import SystemCard from "$lib/components/SystemCard.svelte";
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
</div>
