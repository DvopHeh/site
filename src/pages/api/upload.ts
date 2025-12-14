import type { APIRoute } from 'astro';

interface Env {
  IMAGES: R2Bucket;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Check authentication
  const isAuthenticated = cookies.get('blog_admin_auth')?.value === 'authenticated';
  
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Validate file size
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomStr}.${extension}`;
    
    // Upload to R2
    const env = locals.runtime.env as Env;
    const arrayBuffer = await file.arrayBuffer();
    
    await env.IMAGES.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Get public URL
    // You can customize this based on your R2 public URL or custom domain
    const publicUrl = `${import.meta.env.PUBLIC_R2_URL || 'https://your-r2-bucket.r2.dev'}/${filename}`;
    
    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      filename: filename
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
