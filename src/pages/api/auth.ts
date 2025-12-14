import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { password } = data;
    
    // Get password from environment variable
    const correctPassword = import.meta.env.BLOG_ADMIN_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      // Set a session cookie (expires in 24 hours)
      cookies.set('blog_admin_auth', 'authenticated', {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax'
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  // Logout - delete the auth cookie
  cookies.delete('blog_admin_auth', {
    path: '/'
  });
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
