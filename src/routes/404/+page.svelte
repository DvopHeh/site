<script lang="ts">
  // /404 — same screen as the real error page, just reachable on purpose
  import NotFound from "$lib/components/NotFound.svelte";
</script>

<svelte:head>
  <title>404 — dvop</title>
</svelte:head>

<NotFound status={404} />
