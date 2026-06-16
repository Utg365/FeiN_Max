'use client';

import { useEffect, useState, useCallback } from 'react';

const SENTIMENT_COLOR = {
  bullish: 'var(--bullish-green)',
  bearish: 'var(--bearish-red)',
  neutral: 'var(--neon-blue)',
};

export default function NewsHub() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');

  const fetchNews = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const url = forceRefresh ? '/api/news?refresh=1' : '/api/news';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('News fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const filtered = filter === 'ALL'
    ? articles
    : articles.filter(a => a.region === filter);

  function timeAgo(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <section className="page-view active">
      <div className="glass-card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <h3 className="card-title"><i className="fa-solid fa-rss" /> Dynamic Financial News Hub</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['ALL','NEPAL','INTL'].map(f => (
              <button
                key={f}
                className={`news-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All News' : f === 'NEPAL' ? '🇳🇵 Nepal' : '🌐 International'}
              </button>
            ))}
            <button
              className="news-filter-btn"
              onClick={() => fetchNews(true)}
              style={{ marginLeft: 4 }}
              title="Refresh news"
            >
              <i className={`fa-solid fa-rotate${loading ? ' spinner' : ''}`} />
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-circle-notch spinner" style={{ fontSize: 28, marginBottom: 12, display: 'block' }} />
            Loading latest financial news…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-newspaper" style={{ fontSize: 36, opacity: 0.2, marginBottom: 12, display: 'block' }} />
            No articles found for this filter.
          </div>
        )}

        <div className="news-grid" id="newsGrid">
          {filtered.map((article, i) => (
            <a
              key={i}
              href={article.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="glass-card news-card" style={{ padding: 18, cursor: 'pointer' }}>
                {/* Sentiment Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    padding: '3px 8px', borderRadius: 20,
                    background: `${SENTIMENT_COLOR[article.sentiment] || SENTIMENT_COLOR.neutral}22`,
                    border: `1px solid ${SENTIMENT_COLOR[article.sentiment] || SENTIMENT_COLOR.neutral}44`,
                    color: SENTIMENT_COLOR[article.sentiment] || SENTIMENT_COLOR.neutral,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    {article.sentiment || 'neutral'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {timeAgo(article.pubDate)}
                  </span>
                </div>

                {/* Thumbnail */}
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt=""
                    style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}

                {/* Title */}
                <h4 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  marginBottom: 8,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.title}
                </h4>

                {/* Source */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-globe" style={{ marginRight: 5 }} />
                    {article.source || 'Financial News'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--neon-blue)', fontWeight: 700 }}>
                    Read more <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 9 }} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
