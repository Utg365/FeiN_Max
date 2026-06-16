import { getDb } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth';

// GET: Retrieve user's trading state
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const db = await getDb();
    const row = await db.get(
      'SELECT state_json FROM trading_state WHERE user_id = ?',
      [authUser.sub]
    );

    if (!row || !row.state_json) {
      return Response.json({}, { status: 200 });
    }

    try {
      return Response.json(JSON.parse(row.state_json), { status: 200 });
    } catch (e) {
      return Response.json({}, { status: 200 });
    }
  } catch (err) {
    console.error('Get state error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST: Save user's trading state
export async function POST(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const payload = await req.json();
    const db = await getDb();

    // SQLite Upsert using ON CONFLICT on primary key (user_id)
    await db.run(
      `INSERT INTO trading_state (user_id, state_json, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         state_json = excluded.state_json,
         updated_at = excluded.updated_at`,
      [authUser.sub, JSON.stringify(payload)]
    );

    return Response.json({ message: 'State saved.' }, { status: 200 });
  } catch (err) {
    console.error('Save state error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
