<script lang="ts">
	import { onMount } from 'svelte';
	import MarkdownIt from 'markdown-it';

	const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

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

	let isAuthenticated = $state(false);
	let password = $state('');
	let loginError = $state('');
	let posts: Post[] = $state([]);
	
	// Form state
	let editingId: number | null = $state(null);
	let title = $state('');
	let slug = $state('');
	let description = $state('');
	let content = $state('');
	let featuredImage = $state('');
	let published = $state(false);
	let notification = $state({ show: false, message: '', type: 'success' });

	$effect(() => {
		// Auto-generate slug from title
		if (title && !editingId) {
			slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}
	});

	let preview = $derived(md.render(content));

	async function login(e: Event) {
		e.preventDefault();
		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			const data = await response.json();
			if (data.success) {
				isAuthenticated = true;
				loadPosts();
			} else {
				loginError = 'Invalid password';
				password = '';
			}
		} catch (e) {
			loginError = 'Login failed. Please try again.';
		}
	}

	async function logout() {
		await fetch('/api/auth', { method: 'DELETE' });
		isAuthenticated = false;
	}

	async function loadPosts() {
		try {
			const response = await fetch('/api/blog');
			if (response.ok) {
				posts = await response.json();
			}
		} catch (e) {
			console.error('Error loading posts:', e);
		}
	}

	function clearForm() {
		editingId = null;
		title = '';
		slug = '';
		description = '';
		content = '';
		featuredImage = '';
		published = false;
	}

	function editPost(post: Post) {
		editingId = post.id;
		title = post.title;
		slug = post.slug;
		description = post.description || '';
		content = post.content;
		featuredImage = post.featured_image || '';
		published = post.published;
	}

	async function savePost(e: Event) {
		e.preventDefault();
		
		const postData = {
			id: editingId,
			title,
			slug,
			description,
			content,
			featured_image: featuredImage,
			published
		};

		try {
			const response = await fetch('/api/blog', {
				method: editingId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData)
			});

			if (response.ok) {
				notification = { show: true, message: editingId ? 'Post updated!' : 'Post created!', type: 'success' };
				clearForm();
				loadPosts();
				setTimeout(() => notification.show = false, 3000);
			} else {
				notification = { show: true, message: 'Failed to save post', type: 'error' };
			}
		} catch (e) {
			notification = { show: true, message: 'Network error', type: 'error' };
		}
	}

	async function deletePost(id: number) {
		if (!confirm('Are you sure you want to delete this post?')) return;
		
		try {
			const response = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				notification = { show: true, message: 'Post deleted!', type: 'success' };
				loadPosts();
				setTimeout(() => notification.show = false, 3000);
			}
		} catch (e) {
			notification = { show: true, message: 'Failed to delete post', type: 'error' };
		}
	}

	onMount(() => {
		// Check if cookies indicate authentication (simplified check)
		// Full auth is handled by the cookie set by the API
		loadPosts();
	});
</script>

<svelte:head>
	<title>Blog Admin</title>
</svelte:head>

{#if !isAuthenticated}
	<!-- Login Screen -->
	<div class="login-screen">
		<div class="login-container">
			<h1>Blog Admin Login</h1>
			<p>Please enter your password to access the admin panel</p>
			
			<form class="login-form" onsubmit={login}>
				<div class="form-group">
					<label for="password">Password</label>
					<input type="password" id="password" bind:value={password} required autofocus />
				</div>
				
				<button type="submit" class="btn-primary">Login</button>
				
				{#if loginError}
					<div class="error-message">{loginError}</div>
				{/if}
			</form>
			
			<a href="/blog" class="back-link">← Back to Blog</a>
		</div>
	</div>
{:else}
	<!-- Admin Interface -->
	<div class="admin-container">
		<div class="admin-header">
			<h1>Blog Admin</h1>
			<div class="header-actions">
				<button class="btn-logout" onclick={logout}>🔒 Logout</button>
				<a href="/blog" class="back-link">← Back to Blog</a>
			</div>
		</div>

		<div class="admin-content">
			<div class="editor-section">
				<h2>{editingId ? 'Edit Post' : 'Create New Post'}</h2>
				
				<form class="post-form" onsubmit={savePost}>
					<div class="form-group">
						<label for="title">Title *</label>
						<input type="text" id="title" bind:value={title} required />
					</div>

					<div class="form-group">
						<label for="slug">Slug *</label>
						<input type="text" id="slug" bind:value={slug} required />
						<small>Auto-generated from title</small>
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<textarea id="description" bind:value={description} rows="2" placeholder="Brief description"></textarea>
					</div>

					<div class="form-group">
						<label for="featuredImage">Featured Image URL</label>
						<input type="url" id="featuredImage" bind:value={featuredImage} placeholder="https://..." />
					</div>

					<div class="editor-preview-container">
						<div class="editor-pane">
							<label for="content">Content (Markdown) *</label>
							<textarea id="content" bind:value={content} rows="15" required placeholder="Write in Markdown..."></textarea>
						</div>
						<div class="preview-pane">
							<label>Live Preview</label>
							<div class="markdown-preview">
								{@html preview}
							</div>
						</div>
					</div>

					<div class="form-actions">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={published} />
							<span>Published</span>
						</label>
					</div>

					<div class="form-buttons">
						<button type="submit" class="btn-primary">Save Post</button>
						<button type="button" class="btn-secondary" onclick={clearForm}>Clear Form</button>
					</div>
				</form>

				{#if notification.show}
					<div class="notification {notification.type}">{notification.message}</div>
				{/if}
			</div>

			<div class="posts-list">
				<h2>Existing Posts</h2>
				<div class="posts-container">
					{#if posts.length === 0}
						<div class="loading">No posts yet</div>
					{:else}
						{#each posts as post}
							<div class="post-item">
								<div class="post-item-header">
									<h3 class="post-item-title">{post.title}</h3>
									<div class="post-item-actions">
										<button class="btn-edit" onclick={() => editPost(post)}>Edit</button>
										<button class="btn-delete" onclick={() => deletePost(post.id)}>Delete</button>
									</div>
								</div>
								<div class="post-item-meta">
									{post.published ? '✓ Published' : '○ Draft'} | /{post.slug}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.login-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.login-container {
		background: rgba(255, 255, 255, 0.05);
		padding: 3rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		max-width: 400px;
		width: 100%;
		text-align: center;
	}

	.login-container h1 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
	}

	.login-container p {
		color: var(--color-text-muted);
		margin-bottom: 2rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: left;
	}

	.form-group label {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		font-family: inherit;
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-group small {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.error-message {
		padding: 0.75rem;
		background: rgba(255, 0, 0, 0.2);
		color: #ff4444;
		border: 1px solid rgba(255, 0, 0, 0.3);
		border-radius: 6px;
	}

	.btn-primary, .btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	.btn-primary {
		background: var(--color-primary);
		color: #000;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.admin-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.admin-header h1 {
		margin: 0;
		color: var(--color-text);
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn-logout {
		padding: 0.5rem 1rem;
		background: rgba(255, 0, 0, 0.2);
		color: #ff4444;
		border: 1px solid rgba(255, 0, 0, 0.3);
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-logout:hover {
		background: rgba(255, 0, 0, 0.3);
	}

	.admin-content {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
	}

	.editor-section, .posts-list {
		background: rgba(255, 255, 255, 0.05);
		padding: 2rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.editor-section h2, .posts-list h2 {
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
	}

	.post-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.editor-preview-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.editor-pane, .preview-pane {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.markdown-preview {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1rem;
		min-height: 400px;
		overflow-y: auto;
		color: var(--color-text);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.form-buttons {
		display: flex;
		gap: 1rem;
	}

	.notification {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 6px;
	}

	.notification.success {
		background: rgba(0, 255, 0, 0.2);
		color: #00ff00;
		border: 1px solid rgba(0, 255, 0, 0.3);
	}

	.notification.error {
		background: rgba(255, 0, 0, 0.2);
		color: #ff4444;
		border: 1px solid rgba(255, 0, 0, 0.3);
	}

	.posts-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.post-item {
		background: rgba(0, 0, 0, 0.3);
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid var(--color-border);
	}

	.post-item-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 0.5rem;
	}

	.post-item-title {
		color: var(--color-text);
		font-weight: 500;
		margin: 0;
		font-size: 1rem;
	}

	.post-item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-edit, .btn-delete {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-edit {
		background: var(--color-primary);
		color: white;
	}

	.btn-delete {
		background: #ef4444;
		color: white;
	}

	.post-item-meta {
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.loading {
		color: var(--color-text-muted);
		padding: 2rem;
		text-align: center;
	}

	@media (max-width: 1024px) {
		.admin-content {
			grid-template-columns: 1fr;
		}
		.editor-preview-container {
			grid-template-columns: 1fr;
		}
	}
</style>
