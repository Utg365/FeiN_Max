import { getAuthUser } from '../../../lib/auth';

export async function POST(req) {
  try {
    const data = await req.json();
    const query = (data.query || data.message || '').trim();
    const portfolio = data.portfolio || null;

    if (!query) {
      return Response.json({
        reply: 'Fein Core received empty terminal payload. Please specify a financial query.',
        reply_plain: 'Please specify a financial query.',
        alerts: [],
        error: false
      }, { status: 200 });
    }

    const authUser = getAuthUser(req);
    const sessionId = authUser ? String(authUser.sub) : 'anon';

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/v1/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: sessionId,
        portfolio: portfolio
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI backend error:', errorText);
      return Response.json({ 
        reply: '<strong>[Fein AI Error]</strong><br>Failed to communicate with the AI engine.',
        reply_plain: 'Failed to communicate with AI engine.',
        alerts: [],
        error: true,
        error_msg: errorText
      }, { status: 200 }); // Return 200 with error payload for clean client display
    }

    const result = await response.json();
    return Response.json(result, { status: 200 });

  } catch (err) {
    console.error('Chat API Route error:', err);
    return Response.json({ 
      reply: '<strong>[Fein AI Error]</strong><br>Internal server error processing chatbot request.',
      reply_plain: 'Internal server error.',
      alerts: [],
      error: true,
      error_msg: err.message 
    }, { status: 500 });
  }
}
