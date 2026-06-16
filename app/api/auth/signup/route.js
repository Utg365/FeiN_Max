import { getDb } from '../../../../lib/db';
import { hashPassword, createToken } from '../../../../lib/auth';

const GMAIL_RE = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

function isOldEnough(dobStr) {
  try {
    const dob = new Date(dobStr);
    const today = new Date();
    const cutoff = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return dob <= cutoff;
  } catch (err) {
    return false;
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const username = (data.username || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const dob = (data.dob || '').trim();
    const password = data.password || '';

    // Validate inputs
    if (!USERNAME_RE.test(username)) {
      return Response.json(
        { error: 'Username must be 3–24 characters (letters, numbers, underscores).' },
        { status: 400 }
      );
    }

    if (!GMAIL_RE.test(email)) {
      return Response.json(
        { error: 'Only @gmail.com addresses are accepted.' },
        { status: 400 }
      );
    }

    if (!dob || !isOldEnough(dob)) {
      return Response.json(
        { error: 'You must be at least 16 years old to register.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check duplicate email
    const emailExists = await db.get('SELECT 1 FROM users WHERE email = ?', [email]);
    if (emailExists) {
      return Response.json(
        { error: 'An account with this Gmail already exists.' },
        { status: 409 }
      );
    }

    // Check duplicate username
    const usernameExists = await db.get('SELECT 1 FROM users WHERE username = ?', [username]);
    if (usernameExists) {
      return Response.json(
        { error: 'This username is already taken.' },
        { status: 409 }
      );
    }

    // Insert user
    const pwHash = hashPassword(password);
    const result = await db.run(
      'INSERT INTO users (username, email, dob, password_hash) VALUES (?, ?, ?, ?)',
      [username, email, dob, pwHash]
    );
    const userId = result.lastID;

    // Create default trading state
    await db.run(
      'INSERT INTO trading_state (user_id, state_json) VALUES (?, ?)',
      [userId, '{}']
    );

    const token = createToken(userId, username);

    return Response.json(
      {
        message: 'Account created successfully.',
        token,
        user: {
          id: userId,
          username,
          email,
          dob,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
