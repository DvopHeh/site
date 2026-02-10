<script lang="ts">
  import { onMount, tick } from "svelte";

  let { text, class: className = "" }: { text: string; class?: string } =
    $props();

  let containerEl: HTMLDivElement | undefined = $state();
  let overflows = $state(false);

  async function checkOverflow() {
    await tick();
    if (containerEl) {
      const measureSpan = containerEl.querySelector(
        ".marquee-measure",
      ) as HTMLElement;
      if (measureSpan) {
        overflows = measureSpan.scrollWidth > containerEl.clientWidth;
      }
    }
  }

  onMount(() => {
    checkOverflow();
    const observer = new ResizeObserver(() => checkOverflow());
    if (containerEl) observer.observe(containerEl);
    return () => observer.disconnect();
  });

  $effect(() => {
    text;
    checkOverflow();
  });
</script>

<div class="marquee-container {className}" bind:this={containerEl}>
  <span class="marquee-measure">{text}</span>
  {#if overflows}
    <div class="marquee-inner">
      <span>{text}</span>
      <span>{text}</span>
    </div>
  {:else}
    <span>{text}</span>
  {/if}
</div>

<style>
  .marquee-container {
    overflow: hidden;
    white-space: nowrap;
    position: relative;
  }

  .marquee-measure {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
  }

  .marquee-inner {
    display: inline-block;
    white-space: nowrap;
    animation: marquee 12s linear infinite;
  }

  .marquee-inner span {
    padding-right: 3rem;
  }

  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
</style>
