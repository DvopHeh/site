import type { APIRoute } from 'astro';

interface Env {
  blog: D1Database;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  
  try {
    const { results } = await env.blog.prepare(`
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
    
    const { success } = await env.blog.prepare(`
      INSERT INTO blog (title, content, slug, description, published, tags, author, featured_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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

export const PUT: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  
  try {
    const data = await request.json();
    const { id, title, content, slug, description, published, tags, author, featured_image } = data;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const { success } = await env.blog.prepare(`
      UPDATE blog 
      SET title = ?, content = ?, slug = ?, description = ?, published = ?, tags = ?, author = ?, featured_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, content, slug, description, published, tags || '[]', author || 'dvop', featured_image || null, id).run();
    
    if (success) {
      return new Response(JSON.stringify({ message: 'Post updated successfully' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      throw new Error('Failed to update post');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const { success } = await env.blog.prepare(`
      DELETE FROM blog WHERE id = ?
    `).bind(id).run();
    
    if (success) {
      return new Response(JSON.stringify({ message: 'Post deleted successfully' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      throw new Error('Failed to delete post');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};