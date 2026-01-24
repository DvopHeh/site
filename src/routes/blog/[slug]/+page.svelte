<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import MarkdownIt from 'markdown-it';

	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true
	});

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

	let post: Post | null = $state(null);
	let loading = $state(true);
	let notFound = $state(false);
	let renderedContent = $state('');

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
		const slug = $page.params.slug;
		
		try {
			const response = await fetch('/api/blog');
			if (response.ok) {
				const posts = await response.json();
				post = posts.find((p: Post) => p.slug === slug);
				
				if (post) {
					renderedContent = md.render(post.content);
				} else {
					notFound = true;
				}
			} else {
				notFound = true;
			}
		} catch (e) {
			console.error('Error loading post:', e);
			notFound = true;
		} finally {
			loading = false;
		}
	});
</script>

<div class="blog-post-container">
	{#if loading}
		<div class="loading">
			<p>Loading...</p>
		</div>
	{:else if notFound}
		<div class="not-found">
			<h1>Post Not Found</h1>
			<a href="/blog">← Back to Blog</a>
		</div>
	{:else if post}
		<article class="blog-post">
			<a href="/blog" class="back-link">← Back to Blog</a>

			{#if post.featured_image}
				<div class="featured-image-container">
					<img src={post.featured_image} alt={post.title} />
				</div>
			{/if}

			<header class="post-header">
				<h1 class="post-title">{post.title}</h1>
				<div class="post-meta">
					<div class="post-date">Published {formatDate(post.created_at)}</div>
					{#if post.updated_at && post.updated_at !== post.created_at}
						<div class="post-date">Updated {formatDate(post.updated_at)}</div>
					{/if}
				</div>
			</header>

			<div class="post-content">
				<div class="post-body">
					{@html renderedContent}
				</div>
			</div>
		</article>
	{/if}
</div>
