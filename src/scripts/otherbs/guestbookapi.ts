// src/pages/api/guestbook.js
export async function POST({ request, locals, redirect }) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const message = formData.get('message');
    
    if (!name || !message) {
      return new Response('Name and message are required', { status: 400 });
    }

    // Insert into D1 database
    await locals.runtime.env.DB.prepare(
      'INSERT INTO guestbook_entries (name, message) VALUES (?, ?)'
    ).bind(name, message).run();

    // Redirect back to the referring page
    const referer = request.headers.get('referer') || '/';
    return Response.redirect(referer, 302);
  } catch (error) {
    console.error('Error adding entry:', error);
    return new Response('Failed to add entry', { status: 500 });
  }
}