import type { RequestHandler } from './$types';

interface Env {
	'images-blog': R2Bucket;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env as Env | undefined;
	
	try {
		const bucket = env?.['images-blog'];
		if (!bucket) {
			return new Response(JSON.stringify({ error: 'Storage not available' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		
		if (!file) {
			return new Response(JSON.stringify({ error: 'No file provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return new Response(JSON.stringify({ error: 'Invalid file type' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Generate unique filename
		const ext = file.name.split('.').pop();
		const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
		
		// Upload to R2
		const arrayBuffer = await file.arrayBuffer();
		await bucket.put(filename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type
			}
		});

		// Return the URL (adjust based on your R2 public access configuration)
		const url = `/images/${filename}`;
		
		return new Response(JSON.stringify({ url, filename }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Upload error:', error);
		return new Response(JSON.stringify({ error: 'Upload failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
