import { getDb } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.get(
      'SELECT id, username, email, dob, avatar, created_at, last_login FROM users WHERE id = ?',
      [authUser.sub]
    );

    if (!user) {
      return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    return Response.json(user, { status: 200 });
  } catch (err) {
    console.error('Fetch me error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
