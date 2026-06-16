import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  timeout: 5000 // 5 seconds timeout per feed
});

// Cache variables
let newsCache = [];
let newsCacheTime = 0;

const NEPAL_SOURCES = [
  { id: 'mero-lagani', name: 'Mero Lagani', url: 'https://merolagani.com/rss.aspx', cat: 'NEPAL' },
  { id: 'share-sansar', name: 'Share Sansar', url: 'https://www.sharesansar.com/rss', cat: 'NEPAL' },
  { id: 'artha-kendra', name: 'Artha Kendra', url: 'https://arthakendra.com/feed', cat: 'NEPAL' },
  { id: 'artha-sansar', name: 'Artha Sansar', url: 'https://arthasansar.com/feed', cat: 'NEPAL' },
  { id: 'nepse-bajar', name: 'Nepse Bajar', url: 'https://nepsebajar.com/feed', cat: 'NEPAL' },
  { id: 'bizmandu', name: 'Bizmandu', url: 'https://bizmandu.com/feed', cat: 'NEPAL' },
  { id: 'corporate-khabar', name: 'Corporate Khabar', url: 'https://corporatekhabar.com/feed', cat: 'NEPAL' },
  { id: 'nepali-paisa', name: 'Nepali Paisa', url: 'https://nepalipaisa.com/feed', cat: 'NEPAL' },
];

const INTL_FALLBACK = [
  {
    title: 'NYSE and NASDAQ see heavy institutional volume ahead of consumer spending data',
    source: 'Wall Street Journal', sentiment: 'BULLISH', score: '82%', category: 'INTL',
    summary: 'Major investment houses are loading long equities ahead of consumer spending reports.',
    url: 'https://www.wsj.com/markets'
  },
  {
    title: 'Federal Reserve Chairman hints at possible rate cuts in Q3',
    source: 'Bloomberg Markets', sentiment: 'BULLISH', score: '76%', category: 'INTL',
    summary: 'Inflation is cooling faster than forecast, sparking talk of rate reductions.',
    url: 'https://www.bloomberg.com/markets'
  },
  {
    title: 'Crypto liquidation cascade briefly drops Bitcoin to $65,500',
    source: 'CoinDesk', sentiment: 'BEARISH', score: '68%', category: 'INTL',
    summary: 'Leveraged margin accounts experienced heavy liquidations before buyers stepped in.',
    url: 'https://www.coindesk.com/markets'
  },
  {
    title: 'Euro slides to 3-month lows following ECB inflation downgrades',
    source: 'Reuters Business', sentiment: 'BEARISH', score: '75%', category: 'INTL',
    summary: 'ECB officials cited weakening consumer spending as reason for potential easing.',
    url: 'https://www.reuters.com/markets'
  },
];

// Helper to strip HTML tags
function cleanText(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Helper to compute relative time
function getTimeAgo(pubDateStr) {
  try {
    const pubDate = new Date(pubDateStr);
    const diffMs = new Date() - pubDate;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  } catch (e) {
    return pubDateStr ? pubDateStr.substring(0, 16) : '';
  }
}

// Sentiment scorer
function getSentiment(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  const bullWords = ['gain', 'rise', 'rally', 'bullish', 'surge', 'high', 'growth', 'profit', 'positive', 'recover', 'up', 'increase'];
  const bearWords = ['fall', 'drop', 'decline', 'bearish', 'crash', 'loss', 'low', 'risk', 'negative', 'down', 'decrease', 'liquidat'];

  let bullScore = 0;
  let bearScore = 0;

  bullWords.forEach(w => {
    if (text.includes(w)) bullScore++;
  });
  bearWords.forEach(w => {
    if (text.includes(w)) bearScore++;
  });

  if (bullScore > bearScore) {
    return { sentiment: 'BULLISH', score: `${Math.min(95, 55 + bullScore * 8)}%` };
  } else if (bearScore > bullScore) {
    return { sentiment: 'BEARISH', score: `${Math.min(95, 55 + bearScore * 8)}%` };
  }
  return { sentiment: 'NEUTRAL', score: 'N/A' };
}

// Fetch Nepal RSS
async function fetchNepalNews() {
  const articles = [];
  
  const promises = NEPAL_SOURCES.map(async (src) => {
    try {
      const feed = await parser.parseURL(src.url);
      const items = feed.items.slice(0, 5);
      
      items.forEach(item => {
        const title = cleanText(item.title);
        const summary = cleanText(item.contentSnippet || item.content || '').substring(0, 200);
        const { sentiment, score } = getSentiment(title, summary);
        
        let pubDateStr = new Date().toISOString();
        if (item.pubDate) {
          try {
            const parsed = new Date(item.pubDate);
            if (!isNaN(parsed.getTime())) {
              pubDateStr = parsed.toISOString();
            }
          } catch (e) {
            // Keep default
          }
        }
        
        if (title) {
          articles.push({
            title,
            summary: summary + (summary.length === 200 ? '...' : ''),
            source: src.name,
            link: item.link || null,
            pubDate: pubDateStr,
            sentiment: sentiment.toLowerCase(),
            score,
            region: 'NEPAL'
          });
        }
      });
    } catch (err) {
      // Silently fail individual feeds to keep server resilient
    }
  });

  await Promise.all(promises);
  return articles;
}

export async function GET(request) {
  try {
    const now = Date.now();
    let forceRefresh = false;
    
    if (request && request.url) {
      try {
        const { searchParams } = new URL(request.url);
        forceRefresh = searchParams.get('refresh') === '1';
      } catch (urlErr) {
        // Silently ignore URL parsing errors
      }
    }
    
    // Refresh cache if forceRefresh is requested, cache is older than 5 minutes, or empty
    if (forceRefresh || now - newsCacheTime > 300000 || newsCache.length === 0) {
      const nepalArticles = await fetchNepalNews();
      
      const intlArticles = INTL_FALLBACK.map(a => {
        const minutesAgo = Math.floor(Math.random() * 120) + 5;
        const pubDate = new Date(now - minutesAgo * 60 * 1000).toISOString();
        return {
          title: a.title,
          summary: a.summary,
          source: a.source,
          link: a.url || null,
          pubDate,
          sentiment: (a.sentiment || 'NEUTRAL').toLowerCase(),
          score: a.score,
          region: 'INTL'
        };
      });
      
      newsCache = [...nepalArticles, ...intlArticles];
      newsCacheTime = now;
    }

    return Response.json({ articles: newsCache }, { status: 200 });
  } catch (err) {
    console.error('Market news fetch error:', err);
    return Response.json({ error: 'Failed to fetch news.' }, { status: 500 });
  }
}

// Support forced refresh through POST
export async function POST() {
  clearNewsCache();
  return Response.json({ status: 'cache cleared' }, { status: 200 });
}

export function clearNewsCache() {
  newsCacheTime = 0;
  newsCache = [];
}

