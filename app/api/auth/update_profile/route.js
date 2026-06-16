import { getDb } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function PUT(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const data = await req.json();
    const username = (data.username || '').trim();
    const avatar = (data.avatar || '').trim();

    const db = await getDb();
    const updates = [];
    const params = [];

    if (username) {
      if (!USERNAME_RE.test(username)) {
        return Response.json({ error: 'Invalid username format.' }, { status: 400 });
      }

      // Check username clash with other users
      const clash = await db.get(
        'SELECT 1 FROM users WHERE username = ? AND id != ?',
        [username, authUser.sub]
      );
      if (clash) {
        return Response.json({ error: 'Username already taken.' }, { status: 409 });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    params.push(authUser.sub);
    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return Response.json({ message: 'Profile updated.' }, { status: 200 });
  } catch (err) {
    console.error('Update profile error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
