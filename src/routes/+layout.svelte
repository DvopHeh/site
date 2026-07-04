<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import Navbar from "$lib/components/Navbar.svelte";
  import EasterEggs from "$lib/components/EasterEggs.svelte";
  import Terminal from "$lib/components/Terminal.svelte";
  import Starfall from "$lib/components/Starfall.svelte";
  import { starfallEnabled, starfallForced } from "$lib/stores";

  // only render the canvas after mount so we don't fight SSR / hydration
  let mounted = $state(false);

  // pick the theme on load: whatever you saved last, else match your OS setting
  onMount(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemIsDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const currentTheme = savedTheme || (systemIsDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", currentTheme);
    mounted = true;
  });
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/images/pfp.png" />
  <meta property="og:url" content="" />
  <link rel="icon" type="image/png" href="/images/icon-bar.png" />
  <title>Dvop's silly little site</title>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
  />
</svelte:head>

<Navbar />
<EasterEggs />
<slot />
<Terminal />
{#if mounted && ($starfallEnabled || $starfallForced)}
  <Starfall />
{/if}
