<script lang="ts">
  // homepage. just the three columns, profile comes from +page.server.ts
  import LeftColumn from "$lib/components/home/LeftColumn.svelte";
  import MiddleColumn from "$lib/components/home/MiddleColumn.svelte";
  import RightColumn from "$lib/components/home/RightColumn.svelte";

  let { data } = $props();
</script>

<div class="container landing-page">
  <LeftColumn />
  <MiddleColumn profile={data.profile} />
  <RightColumn />
</div>
