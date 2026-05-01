import type { RequestHandler } from './$types';
import { isAdminAuthenticated, type AdminAuthEnv } from '$lib/server/adminAuth';

interface Env extends AdminAuthEnv {
	blog: D1Database;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

const normalizeSlug = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

const parsePostPayload = (data: Record<string, unknown>) => {
	const title = String(data.title ?? '').trim();
	const content = String(data.content ?? '').trim();
	const slugInput = String(data.slug ?? title).trim();
	const slug = normalizeSlug(slugInput);
	const description = String(data.description ?? '').trim();
	const published = Boolean(data.published);
	const tags = typeof data.tags === 'string' ? data.tags : '[]';
	const author = String(data.author ?? 'dvop').trim() || 'dvop';
	const featuredImage = String(data.featured_image ?? '').trim();

	return {
		title,
		content,
		slug,
		description: description || null,
		published,
		tags,
		author,
		featuredImage: featuredImage || null
	};
};

export const GET: RequestHandler = async ({ platform, cookies }) => {
	const env = platform?.env as Env | undefined;

	try {
		if (!env?.blog) {
			return json({ error: 'Database not available' }, 500);
		}

		const isAdmin = await isAdminAuthenticated(cookies, env);
		const query = isAdmin
			? `SELECT * FROM blog ORDER BY created_at DESC`
			: `SELECT * FROM blog WHERE published = 1 ORDER BY created_at DESC`;

		const { results } = await env.blog.prepare(query).all();
		return json(results);
	} catch (error) {
		console.error('Failed to fetch posts:', error);
		return json({ error: 'Failed to fetch posts' }, 500);
	}
};

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) {
		return json({ error: 'Unauthorized' }, 401);
	}

	try {
		if (!env?.blog) {
			return json({ error: 'Database not available' }, 500);
		}

		const data = (await request.json()) as Record<string, unknown>;
		const post = parsePostPayload(data);
		if (!post.title || !post.content || !post.slug) {
			return json({ error: 'Title, content and slug are required.' }, 400);
		}

		const { success } = await env.blog
			.prepare(`
				INSERT INTO blog (title, content, slug, description, published, tags, author, featured_image, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
			`)
			.bind(
				post.title,
				post.content,
				post.slug,
				post.description,
				post.published,
				post.tags,
				post.author,
				post.featuredImage
			)
			.run();

		if (success) {
			return json({ message: 'Post created successfully' }, 201);
		}
		throw new Error('Failed to create post');
	} catch (error) {
		console.error('Failed to create post:', error);
		return json({ error: 'Failed to create post' }, 500);
	}
};

export const PUT: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) {
		return json({ error: 'Unauthorized' }, 401);
	}

	try {
		if (!env?.blog) {
			return json({ error: 'Database not available' }, 500);
		}

		const data = (await request.json()) as Record<string, unknown>;
		const id = Number(data.id);
		if (!Number.isInteger(id) || id <= 0) {
			return json({ error: 'Valid post ID is required.' }, 400);
		}

		const post = parsePostPayload(data);
		if (!post.title || !post.content || !post.slug) {
			return json({ error: 'Title, content and slug are required.' }, 400);
		}

		const { success } = await env.blog
			.prepare(`
				UPDATE blog
				SET title = ?, content = ?, slug = ?, description = ?, published = ?, tags = ?, author = ?, featured_image = ?, updated_at = datetime('now')
				WHERE id = ?
			`)
			.bind(
				post.title,
				post.content,
				post.slug,
				post.description,
				post.published,
				post.tags,
				post.author,
				post.featuredImage,
				id
			)
			.run();

		if (success) {
			return json({ message: 'Post updated successfully' });
		}
		throw new Error('Failed to update post');
	} catch (error) {
		console.error('Failed to update post:', error);
		return json({ error: 'Failed to update post' }, 500);
	}
};

export const DELETE: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;
	if (!(await isAdminAuthenticated(cookies, env))) {
		return json({ error: 'Unauthorized' }, 401);
	}

	try {
		if (!env?.blog) {
			return json({ error: 'Database not available' }, 500);
		}

		const url = new URL(request.url);
		const id = Number(url.searchParams.get('id'));
		if (!Number.isInteger(id) || id <= 0) {
			return json({ error: 'Valid post ID is required' }, 400);
		}

		const { success } = await env.blog.prepare(`DELETE FROM blog WHERE id = ?`).bind(id).run();
		if (success) {
			return json({ message: 'Post deleted successfully' });
		}
		throw new Error('Failed to delete post');
	} catch (error) {
		console.error('Failed to delete post:', error);
		return json({ error: 'Failed to delete post' }, 500);
	}
};
