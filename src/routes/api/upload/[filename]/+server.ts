import type { RequestHandler } from './$types';

interface Env {
	'images-blog': R2Bucket;
}

const MIME_BY_EXTENSION: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp'
};

export const GET: RequestHandler = async ({ params, platform }) => {
	const env = platform?.env as Env | undefined;
	const bucket = env?.['images-blog'];

	if (!bucket) {
		return new Response('Storage not available', { status: 500 });
	}

	const object = await bucket.get(params.filename);
	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const headers = new Headers();
	const extension = params.filename.split('.').pop()?.toLowerCase() ?? '';
	headers.set('content-type', MIME_BY_EXTENSION[extension] ?? 'application/octet-stream');
	headers.set('cache-control', 'public, max-age=31536000, immutable');

	return new Response(object.body, { headers });
};
