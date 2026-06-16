import { getAuthUser } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    const sessionId = authUser ? String(authUser.sub) : 'anon';

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/v1/chat/chat/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI clear session error:', errorText);
      return Response.json({ error: 'Failed to clear chat session on backend' }, { status: response.status });
    }

    const result = await response.json();
    return Response.json(result, { status: 200 });

  } catch (err) {
    console.error('Chat Clear API Route error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
