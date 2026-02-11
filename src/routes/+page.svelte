<script lang="ts">
  import DebugMenu from "$lib/components/DebugMenu.svelte";
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

<DebugMenu />
