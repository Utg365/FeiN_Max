export async function POST(req) {
  try {
    const data = await req.json();
    const query = (data.query || data.message || '').trim();

    if (!query) {
      return Response.json({
        reply: 'Fein Core received empty terminal payload. Please specify a financial query.'
      }, { status: 200 });
    }

    const upper = query.toUpperCase();
    let reply = '';

    if (upper.includes('TSLA') || upper.includes('TESLA')) {
      reply = `<strong>[Fein Server Analysis - TSLA]</strong><br>` +
              `Tesla exhibits highly volatile MACD waves. Immediate supports have formed near $180, ` +
              `whereas resistance bands are firmly cap-staged at $188. Technical parameters suggest accumulating ` +
              `long shares on breakouts past $184 with strict stops set below $178.`;
    } else if (upper.includes('AAPL') || upper.includes('APPLE')) {
      reply = `<strong>[Fein Server Analysis - AAPL]</strong><br>` +
              `Apple consolidates tightly around its 50-day EMA support ($174.50). Orderbook depth indicates ` +
              `institutional accumulation patterns. Breakout structures above $176.50 confirm targets toward ` +
              `historical resistance levels near $182. Risk profile remains highly favorable.`;
    } else if (upper.includes('BTC') || upper.includes('BITCOIN')) {
      reply = `<strong>[Fein Server Analysis - BTCUSD]</strong><br>` +
              `Bitcoin holds crucial long-term supports at the $66,800 cluster. Volume profiles are thin, ` +
              `confirming consolidation ahead of major breakout expansions. Close above $68,200 sets targets ` +
              `toward fresh local highs at $71,500. Maintain defensive risk allocations.`;
    } else {
      reply = `<strong>[Fein Quantitative Assistant]</strong><br>` +
              `Your query has been indexed. General technical market conditions indicate constructive accumulation ` +
              `for top equities, while crypto markets are digesting recent high-leverage expansions. For detailed risk ` +
              `mitigation, we highly recommend utilizing the built-in position sizing calculator on your terminal!`;
    }

    return Response.json({ reply }, { status: 200 });

  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ error: 'Failed to process chat query.' }, { status: 500 });
  }
}
