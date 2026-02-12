import type { RequestHandler } from './$types';

interface Env {
	'images-blog': R2Bucket;
	BLOG_ADMIN_PASSWORD?: string;
}

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const env = platform?.env as Env | undefined;

	if (cookies.get('blog_admin_credential') !== (env?.BLOG_ADMIN_PASSWORD ?? 'admin')) {
		return json({ error: 'Unauthorized' }, 401);
	}

	const bucket = env?.['images-blog'];
	if (!bucket) {
		return json({ error: 'Storage not available' }, 500);
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return json({ error: 'No file provided' }, 400);
		}

		if (!ALLOWED_TYPES.has(file.type)) {
			return json({ error: 'Invalid file type' }, 400);
		}

		if (file.size > MAX_FILE_SIZE) {
			return json({ error: 'File too large (max 5MB)' }, 400);
		}

		const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined;
		const ext = extension && /^[a-z0-9]+$/.test(extension) ? extension : 'bin';
		const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
		const arrayBuffer = await file.arrayBuffer();

		await bucket.put(filename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type
			}
		});

		const url = `/api/upload/${filename}`;
		const markdownImage = `![${file.name}](${url})`;
		return json({ url, filename, markdownImage });
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Upload failed' }, 500);
	}
};
