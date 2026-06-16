export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${backendUrl}/api/v1/stocks/status`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 } // Cache status for 30 seconds
    });

    if (!res.ok) {
      const errorText = await res.text();
      return Response.json(
        { error: 'Failed to fetch status from NEPSE backend.', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, { status: 200 });

  } catch (err) {
    console.error('Error in NEPSE status proxy route:', err);
    return Response.json(
      { error: 'Could not connect to NEPSE backend server.' },
      { status: 502 }
    );
  }
}
