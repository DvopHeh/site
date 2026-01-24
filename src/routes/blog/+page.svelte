<script lang="ts">
	import { onMount } from 'svelte';

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

	// Konami code detection
	const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
	let konamiIndex = $state(0);

	function formatDate(dateString: string): string {
		if (!dateString || dateString === 'CURRENT_TIMESTAMP') return 'Unknown date';
		try {
			const dateObj = new Date(dateString.replace(' ', 'T') + 'Z');
			if (isNaN(dateObj.getTime())) return 'Unknown date';
			return dateObj.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return 'Unknown date';
		}
	}

	onMount(async () => {
		// Konami code listener
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
		window.addEventListener('keydown', handleKeydown);

		// Load posts
		try {
			const response = await fetch('/api/blog');
			if (response.ok) {
				const allPosts = await response.json();
				posts = allPosts.filter((p: Post) => p.published);
			}
		} catch (e) {
			console.error('Error loading posts:', e);
		} finally {
			loading = false;
		}

		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="blog-container">
	<div class="blog-header">
		<h1>Blog</h1>
		<a href="/blog/admin" class="admin-link" class:visible={showAdmin}>✏️ Admin</a>
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
</div>
