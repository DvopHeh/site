<script lang="ts">
  import type { Post } from "$lib/types/blog";

  let { posts, loading } = $props<{ posts: Post[]; loading: boolean }>();

  function formatDate(dateString: string): string {
    if (!dateString || dateString === "CURRENT_TIMESTAMP") {
      return "Unknown date";
    }

    try {
      const dateObj = new Date(dateString.replace(" ", "T") + "Z");
      if (Number.isNaN(dateObj.getTime())) {
        return "Unknown date";
      }

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  }
</script>

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
          <img src={post.featured_image} alt={post.title} class="post-card-image" />
        {:else}
          <div class="post-card-image"></div>
        {/if}
        <div class="post-card-content">
          <h2 class="post-title">{post.title}</h2>
          <div class="post-dates">
            <div class="post-date">Published {formatDate(post.created_at)}</div>
            {#if post.updated_at && post.updated_at !== post.created_at}
              <div class="post-date">Updated {formatDate(post.updated_at)}</div>
            {/if}
          </div>
          <p class="post-excerpt">{post.description || post.content.substring(0, 150)}...</p>
          <span class="read-more">Read more</span>
        </div>
      </a>
    {/each}
  </div>
{/if}
