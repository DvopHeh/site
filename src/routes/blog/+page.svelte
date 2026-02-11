<script lang="ts">
  import { onMount } from "svelte";
  import BlogHeader from "$lib/components/blog/BlogHeader.svelte";
  import BlogPosts from "$lib/components/blog/BlogPosts.svelte";
  import type { Post } from "$lib/types/blog";
  import { setupKonamiListeners } from "$lib/utils/konami";

  let posts: Post[] = $state([]);
  let loading = $state(true);
  let showAdmin = $state(false);

  onMount(() => {
    const cleanupKonami = setupKonamiListeners({
      onMatch: () => {
        showAdmin = true;
      },
    });

    void (async () => {
      try {
        const response = await fetch("/api/blog");
        if (response.ok) {
          const allPosts: Post[] = await response.json();
          posts = allPosts.filter((post) => post.published);
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        loading = false;
      }
    })();

    return () => {
      cleanupKonami();
    };
  });
</script>

<div class="blog-container">
  <BlogHeader {showAdmin} />
  <BlogPosts {posts} {loading} />
</div>
