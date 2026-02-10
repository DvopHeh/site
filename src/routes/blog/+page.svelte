<script lang="ts">
  import { onMount } from "svelte";

  interface Post {
    id: number;
    title: string;
    slug: string;
    description?: string;
    content: string;
    featured_image?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
  }

  let posts: Post[] = $state([]);
  let loading = $state(true);
  let showAdmin = $state(false);

  // Konami code detection (keyboard)
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
  ];
  let konamiIndex = $state(0);

  // Swipe detection (mobile)
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeSequence: string[] = [];
  let swipeResetTimer: ReturnType<typeof setTimeout> | null = null;
  const SWIPE_THRESHOLD = 30;

  function formatDate(dateString: string): string {
    if (!dateString || dateString === "CURRENT_TIMESTAMP")
      return "Unknown date";
    try {
      const dateObj = new Date(dateString.replace(" ", "T") + "Z");
      if (isNaN(dateObj.getTime())) return "Unknown date";
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    let direction: string | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        direction = dx > 0 ? "ArrowRight" : "ArrowLeft";
      }
    } else {
      if (Math.abs(dy) > SWIPE_THRESHOLD) {
        direction = dy > 0 ? "ArrowDown" : "ArrowUp";
      }
    }

    if (!direction) return;

    swipeSequence.push(direction);
    if (swipeResetTimer) clearTimeout(swipeResetTimer);
    swipeResetTimer = setTimeout(() => {
      swipeSequence = [];
    }, 3000);

    if (swipeSequence.length > konamiCode.length) swipeSequence.shift();

    if (swipeSequence.length === konamiCode.length) {
      let matches = true;
      for (let i = 0; i < konamiCode.length; i++) {
        if (swipeSequence[i] !== konamiCode[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        showAdmin = true;
        swipeSequence = [];
      }
    }
  }

  onMount(async () => {
    // Konami code listener (keyboard)
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          showAdmin = true;
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };
    window.addEventListener("keydown", handleKeydown);

    // Konami code listener (swipe/mobile)
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd);

    // Load posts
    try {
      const response = await fetch("/api/blog");
      if (response.ok) {
        const allPosts = await response.json();
        posts = allPosts.filter((p: Post) => p.published);
      }
    } catch (e) {
      console.error("Error loading posts:", e);
    } finally {
      loading = false;
    }

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  });
</script>

<div class="blog-container">
  <div class="blog-header">
    <h1>Blog</h1>
    <a href="/blog/admin" class="admin-link" class:visible={showAdmin}
      >✏️ Admin</a
    >
  </div>

  {#if loading}
    <div class="posts-grid">
      <div class="loading">Loading posts...</div>
    </div>
  {:else if posts.length === 0}
    <div class="no-posts">
      <p>No posts yet.</p>
    </div>
  {:else}
    <div class="posts-grid">
      {#each posts as post}
        <a href="/blog/{post.slug}" class="post-card">
          {#if post.featured_image}
            <img
              src={post.featured_image}
              alt={post.title}
              class="post-card-image"
            />
          {:else}
            <div class="post-card-image"></div>
          {/if}
          <div class="post-card-content">
            <h2 class="post-title">{post.title}</h2>
            <div class="post-dates">
              <div class="post-date">
                Published {formatDate(post.created_at)}
              </div>
              {#if post.updated_at && post.updated_at !== post.created_at}
                <div class="post-date">
                  Updated {formatDate(post.updated_at)}
                </div>
              {/if}
            </div>
            <p class="post-excerpt">
              {post.description || post.content.substring(0, 150)}...
            </p>
            <span class="read-more">Read more</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
