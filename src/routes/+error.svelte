<script lang="ts">
  // shown whenever a route errors out (mostly 404s). just renders the shared
  // 404 screen with whatever status code we got
  import { page } from "$app/stores";
  import NotFound from "$lib/components/NotFound.svelte";
</script>

<NotFound status={$page.status} />
