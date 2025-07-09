import type { APIRoute } from 'astro';

interface Env {
  DB: D1Database;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM blog 
      ORDER BY created_at DESC
    `).all();
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  
  try {
    const data = await request.json();
    const { title, content, slug, description, published, tags, author, featured_image } = data;
    
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const { success } = await env.DB.prepare(`
      INSERT INTO blog (title, content, slug, description, published, tags, author, featured_image, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(title, content, finalSlug, description, published || false, tags || '[]', author || 'dvop', featured_image || null).run();
    
    if (success) {
      return new Response(JSON.stringify({ message: 'Post created successfully' }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      throw new Error('Failed to create post');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};