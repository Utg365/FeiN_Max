// Deterministic seeded random number generator based on the symbol
function seedRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function GET(req, { params }) {
  try {
    const { symbol } = await params;
    const cleanSymbol = (symbol || '').toUpperCase();
    
    // Initialize seeded random generator
    const random = seedRandom(cleanSymbol);

    // Determine base price based on asset type
    let basePrice = random() * 450 + 50; // $50 to $500 default
    if (cleanSymbol.includes('USD')) {
      if (cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH')) {
        basePrice = random() * 64900 + 100; // $100 to $65000 crypto
      } else {
        basePrice = random() * 1.5 + 0.5; // $0.5 to $2.0 forex
      }
    }

    const historical = [];
    const forecast = [];
    const now = new Date();

    // Generate 10 days of historical data
    for (let i = 10; i > 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      const trend = Math.sin(i * 0.4) * (basePrice * 0.05);
      const noise = (random() * 2 - 1) * (basePrice * 0.01);
      
      historical.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat((basePrice + trend + noise).toFixed(4))
      });
    }

    const lastPrice = historical[historical.length - 1].price;
    const mlConfidence = Math.floor(random() * 25) + 70; // 70 to 95%
    const direction = random() > 0.4 ? 'BULLISH' : 'BEARISH';
    const coef = direction === 'BULLISH' ? 0.025 : -0.02;

    // Generate 5 days of forecast projection
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      const val = lastPrice * (1 + (coef * i) + (random() * 0.02 - 0.01));
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(val.toFixed(4)),
        confidence_upper: parseFloat((val * 1.05).toFixed(4)),
        confidence_lower: parseFloat((val * 0.95).toFixed(4))
      });
    }

    return Response.json({
      symbol: cleanSymbol,
      indicator: direction,
      confidence: `${mlConfidence}%`,
      historical,
      forecast
    }, { status: 200 });

  } catch (err) {
    console.error('Trajectory prediction error:', err);
    return Response.json({ error: 'Failed to generate prediction data.' }, { status: 500 });
  }
}
