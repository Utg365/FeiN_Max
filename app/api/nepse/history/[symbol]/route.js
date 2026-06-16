export async function GET(req, { params }) {
  const { symbol } = await params;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${backendUrl}/api/v1/stocks/${symbol}/history`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Cache history locally in Next.js for 60 seconds
    });

    if (!res.ok) {
      const errorText = await res.text();
      return Response.json(
        { error: `Failed to fetch history for ${symbol} from NEPSE backend.`, details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data, { status: 200 });

  } catch (err) {
    console.error(`Error in NEPSE history proxy route for ${symbol}:`, err);
    return Response.json(
      { error: 'Could not connect to NEPSE backend server.' },
      { status: 502 }
    );
  }
}
