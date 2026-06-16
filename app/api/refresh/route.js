import { clearNewsCache } from '../news/route';

export async function POST() {
  try {
    clearNewsCache();
    return Response.json({ status: 'cache cleared' }, { status: 200 });
  } catch (err) {
    console.error('Forced refresh error:', err);
    return Response.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
