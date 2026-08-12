import { useState, useEffect } from 'react';
import { getFeedbacks, deleteFeedback } from '../services/feedbackService';

const FeedbackExplorer = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  // Debouncing search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        channel: channel || undefined,
        sentiment: sentiment || undefined,
      };

      const res = await getFeedbacks(params);
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load feedback records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [page, debouncedSearch, channel, sentiment]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback?')) return;

    try {
      await deleteFeedback(id);
      loadFeedbacks(); // Reload current page
    } catch (err) {
      console.error(err);
      alert('Failed to delete feedback item');
    }
  };

  const getSentimentBadge = (sentVal, score) => {
    const displayScore = score !== undefined && score !== null ? ` (${score > 0 ? '+' : ''}${score.toFixed(2)})` : '';
    if (sentVal === 'POS') {
      return <span class="badge badge-pos">💚 POSITIVE{displayScore}</span>;
    }
    if (sentVal === 'NEG') {
      return <span class="badge badge-neg">💔 NEGATIVE{displayScore}</span>;
    }
    return <span class="badge badge-neu">💛 NEUTRAL{displayScore}</span>;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1>Feedback Explorer</h1>
        <p class="subtitle">Search, filter, and audit customer testimonials in your secure tenant database</p>
      </div>

      {error && (
        <div class="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div class="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flexGrow: 1, minWidth: '240px' }}>
          <label class="form-label" style={{ marginBottom: '6px' }}>Search Content</label>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search feedback keywords..."
          />
        </div>

        <div style={{ width: '160px' }}>
          <label class="form-label" style={{ marginBottom: '6px' }}>Channel</label>
          <select value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}>
            <option value="">All Channels</option>
            <option value="CSV Import">CSV Import</option>
            <option value="Manual Ingest">Manual Entry</option>
            <option value="Slack Chat">Slack Chat</option>
            <option value="Support Email">Support Email</option>
            <option value="Client Call">Client Call</option>
            <option value="Intercom Chat">Intercom Chat</option>
          </select>
        </div>

        <div style={{ width: '160px' }}>
          <label class="form-label" style={{ marginBottom: '6px' }}>Sentiment</label>
          <select value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1); }}>
            <option value="">All Sentiments</option>
            <option value="POS">Positive</option>
            <option value="NEU">Neutral</option>
            <option value="NEG">Negative</option>
          </select>
        </div>
      </div>

      {/* Feed Table */}
      <div class="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>🌀</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading catalog...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>No feedback found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Try removing filters, searching other terms, or ingesting a CSV file.
            </p>
          </div>
        ) : (
          <>
            <div class="table-container" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Feedback Content</th>
                    <th>Customer</th>
                    <th>Source Channel</th>
                    <th>AI Sentiment</th>
                    <th>Recorded</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr key={f.id}>
                      <td style={{ lineHeight: '1.5', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13.5px' }}>
                        {f.content}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {f.customerLabel || <span style={{ color: 'var(--text-muted)' }}>Anonymous</span>}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '500' }}>
                          {f.channel.toLowerCase().includes('slack') ? '💬' : 
                           f.channel.toLowerCase().includes('email') ? '✉️' : 
                           f.channel.toLowerCase().includes('csv') ? '📂' : '🔌'} {f.channel}
                        </span>
                      </td>
                      <td>
                        {getSentimentBadge(f.sentiment, f.sentimentScore)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {formatDate(f.createdAt)}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDelete(f.id)} 
                          class="btn btn-danger" 
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing <strong>{feedbacks.length}</strong> of <strong>{pagination.totalItems}</strong> feedback items
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  class="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ◀ Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', px: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Page {page} of {pagination.totalPages || 1}
                </span>
                <button 
                  class="pagination-btn"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackExplorer;
