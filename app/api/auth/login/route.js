import { getDb } from '../../../../lib/db';
import { verifyPassword, createToken } from '../../../../lib/auth';

const GMAIL_RE = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

export async function POST(req) {
  try {
    const data = await req.json();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!GMAIL_RE.test(email)) {
      return Response.json(
        { error: 'Only @gmail.com addresses are accepted.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !verifyPassword(user.password_hash, password)) {
      return Response.json(
        { error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // Update last_login timestamp
    await db.run('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?', [user.id]);

    const token = createToken(user.id, user.username);

    return Response.json(
      {
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          dob: user.dob,
          avatar: user.avatar,
          created_at: user.created_at,
          last_login: new Date().toISOString(), // fresh timestamp for response
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
