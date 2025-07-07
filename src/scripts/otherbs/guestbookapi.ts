// scripts/otherbs/guestbookapi.ts
export async function POST({ request, locals }) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const message = formData.get('message');
    
    if (!name || !message) {
      return new Response(JSON.stringify({ error: 'Name and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert into D1 database
    await locals.runtime.env.DB.prepare(
      'INSERT INTO guestbook_entries (name, message) VALUES (?, ?)'
    ).bind(name, message).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to add entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}