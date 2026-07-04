<script lang="ts">
  // the 404 screen. lain wallpaper as the background with a text box off to the
  // side. also switches the meteor overlay on while you're here
  import { onMount, onDestroy } from "svelte";
  import { starfallForced } from "$lib/stores";

  let { status = 404 }: { status?: number } = $props();

  onMount(() => starfallForced.set(true));
  onDestroy(() => starfallForced.set(false));
</script>

<section
  class="relative flex min-h-screen items-center justify-start overflow-hidden bg-black"
>
  <!-- lain on the right (her original orientation) -->
  <img
    src="/images/404.jpg"
    alt=""
    class="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
  />
  <!-- fade the left side to black so the text stays readable -->
  <div
    class="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"
  ></div>

  <!-- everything below is themed after lain's pink + cream palette -->
  <div
    class="relative z-10 ml-6 max-w-md rounded-lg border border-[#e39aa6]/40 bg-[#1a0d12]/55 p-8 shadow-[0_0_40px_rgba(227,154,166,0.15)] backdrop-blur-sm md:ml-16"
  >
    <p
      class="font-mono text-6xl font-bold tracking-tight text-[#e86e8a] drop-shadow-[0_2px_14px_rgba(232,110,138,0.5)] md:text-7xl"
    >
      {status}
    </p>
    <p class="mt-3 font-mono text-lg leading-relaxed text-[#f0e2c8]">
      Oopsie something fucked up I think (or you did)
    </p>
    <a
      href="/"
      class="mt-6 inline-block rounded border border-[#e39aa6]/60 px-4 py-2 font-mono text-sm text-[#e39aa6] transition hover:bg-[#e39aa6]/15 hover:text-[#f0e2c8]"
    >
      ← take me home
    </a>
  </div>
</section>
