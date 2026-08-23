import "./FeedbackExplorer.css";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFeedbacks, deleteFeedback, getThemes, updateFeedbackStatus, reclassifyFeedbacks } from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';

const FeedbackExplorer = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter state from URL parameters
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const theme = searchParams.get('theme') || '';
  const status = searchParams.get('status') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // Input states for inputs that shouldn't search instantly on every key stroke
  const [searchInput, setSearchInput] = useState(search);
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);

  // Options states
  const [themesList, setThemesList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Reclassify selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reclassifying, setReclassifying] = useState(false);

  const isReadOnly = user?.role === 'VIEWER';

  // Sync state with URL parameter updates (e.g. back navigation or resets)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setFromInput(from);
  }, [from]);

  useEffect(() => {
    setToInput(to);
  }, [to]);

  // Load themes once on component mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const res = await getThemes();
        if (res.data.success) {
          setThemesList(res.data.themes || []);
        }
      } catch (err) {
        console.error('Failed to load themes:', err);
      }
    };
    loadThemes();
  }, []);

  // Update query params in URL
  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };
    
    // Clean up empty params
    Object.keys(updated).forEach(key => {
      if (updated[key] === undefined || updated[key] === null || updated[key] === '') {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  };

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, search]);

  // Fetch feedback records based on searchParams
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 10,
        search: search || undefined,
        channel: channel || undefined,
        sentiment: sentiment || undefined,
        theme: theme || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined
      };

      const res = await getFeedbacks(params);
      if (res.data.success) {
        setFeedbacks(res.data.data || res.data.feedbacks || []);
        const pag = res.data.pagination;
        setPagination({
          total: pag.total !== undefined ? pag.total : pag.totalItems,
          totalPages: pag.totalPages,
          limit: pag.limit
        });
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [searchParams]);

  // Clear selection whenever the page/filters change — selected ids from a
  // previous page/filter view shouldn't silently carry over and surprise
  // the user on the next reclassify click.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchParams]);

  // Handle status update
  const handleStatusChange = async (id, newStatus) => {
    try {
      setStatusUpdatingId(id);
      const res = await updateFeedbackStatus(id, newStatus);
      if (res.data.success) {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update status. Please try again.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Handle deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback?')) return;

    try {
      await deleteFeedback(id);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
      alert('Failed to delete feedback item');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchInput('');
    setFromInput('');
    setToInput('');
    setSearchParams({ page: 1 });
  };

  // --- Reclassify selection handlers ---

  const toggleSelected = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = feedbacks.length > 0 && feedbacks.every(f => selectedIds.has(f.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds(prev => {
      if (allOnPageSelected) {
        // Deselect just this page's ids, leave any others untouched
        const next = new Set(prev);
        feedbacks.forEach(f => next.delete(f.id));
        return next;
      }
      const next = new Set(prev);
      feedbacks.forEach(f => next.add(f.id));
      return next;
    });
  };

  const handleReclassify = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmMessage = ids.length === 1
      ? 'Re-run AI classification for this feedback item? This will overwrite its current sentiment and theme.'
      : `Re-run AI classification for ${ids.length} feedback items? This will overwrite their current sentiment and theme.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setReclassifying(true);
      const res = await reclassifyFeedbacks(ids);

      if (res.data.success) {
        const resultsById = new Map(res.data.results.map(r => [r.feedbackId, r]));

        setFeedbacks(prev => prev.map(f => {
          const result = resultsById.get(f.id);
          if (!result) return f;
          return {
            ...f,
            sentiment: result.sentiment,
            sentimentScore: result.sentimentScore,
            Themes: result.theme ? [result.theme] : [],
          };
        }));

        if (res.data.errors && res.data.errors.length > 0) {
          alert(
            `Reclassified ${res.data.results.length} item(s). ${res.data.errors.length} failed:\n` +
            res.data.errors.map(e => `• ${e.error}`).join('\n')
          );
        }
      }

      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to reclassify feedback. Please try again.');
    } finally {
      setReclassifying(false);
    }
  };

  const getSentimentBadge = (sentVal, score) => {
    const displayScore = score !== undefined && score !== null ? ` (${score > 0 ? '+' : ''}${score.toFixed(2)})` : '';
    if (sentVal === 'POS') {
      return <span className="badge badge-pos">💚 POSITIVE{displayScore}</span>;
    }
    if (sentVal === 'NEG') {
      return <span className="badge badge-neg">💔 NEGATIVE{displayScore}</span>;
    }
    return <span className="badge badge-neu">💛 NEUTRAL{displayScore}</span>;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    // Safeguard startPage
    startPage = Math.max(1, startPage);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === page ? 'active' : ''}`}
          style={{
            backgroundColor: i === page ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
            color: i === page ? '#fff' : 'var(--text-secondary)',
            border: i === page ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
            margin: '0 4px',
            fontWeight: i === page ? '600' : 'normal'
          }}
          onClick={() => updateParams({ page: i })}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const showingStart = pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1;
  const showingEnd = Math.min(page * pagination.limit, pagination.total);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1>Feedback Inbox</h1>
        <p className="subtitle">Search, filter, and manage customer insights in your secure tenant database</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div style={{ flex: '2 1 240px', minWidth: '200px' }}>
          <label className="form-label">Search Content</label>
          <input 
            type="text" 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            placeholder="Search feedback..."
          />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label className="form-label">Channel</label>
          <select value={channel} onChange={(e) => { updateParams({ channel: e.target.value, page: 1 }); }}>
            <option value="">All Channels</option>
            <option value="CSV Import">CSV Import</option>
            <option value="Manual Ingest">Manual Entry</option>
            <option value="Slack Chat">Slack Chat</option>
            <option value="Support Email">Support Email</option>
            <option value="Client Call">Client Call</option>
            <option value="Intercom Chat">Intercom Chat</option>
            <option value="Support Ticket">Support Ticket</option>
            <option value="App Store Review">App Store Review</option>
            <option value="NPS Survey">NPS Survey</option>
            <option value="Sales Call Note">Sales Call Note</option>
            <option value="Community Post">Community Post</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label className="form-label">Sentiment</label>
          <select value={sentiment} onChange={(e) => { updateParams({ sentiment: e.target.value, page: 1 }); }}>
            <option value="">All Sentiments</option>
            <option value="POS">Positive</option>
            <option value="NEU">Neutral</option>
            <option value="NEG">Negative</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label className="form-label">Theme</label>
          <select value={theme} onChange={(e) => { updateParams({ theme: e.target.value, page: 1 }); }}>
            <option value="">All Themes</option>
            {themesList.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <label className="form-label">Status</label>
          <select value={status} onChange={(e) => { updateParams({ status: e.target.value, page: 1 }); }}>
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>
        </div>

        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">From</label>
          <input 
            type="date" 
            value={fromInput} 
            onChange={(e) => { setFromInput(e.target.value); updateParams({ from: e.target.value, page: 1 }); }}
          />
        </div>

        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">To</label>
          <input 
            type="date" 
            value={toInput} 
            onChange={(e) => { setToInput(e.target.value); updateParams({ to: e.target.value, page: 1 }); }}
          />
        </div>

        <div>
          <button 
            onClick={handleResetFilters} 
            className="btn btn-secondary"
            style={{ height: '42px', padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Selection bar — only shown once something is selected, and never for Viewers */}
      {!isReadOnly && selectedIds.size > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '12px 20px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--color-primary)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '600' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-secondary"
              disabled={reclassifying}
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              Clear
            </button>
            <button
              onClick={handleReclassify}
              className="btn btn-primary"
              disabled={reclassifying}
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {reclassifying ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🌀</span>
                  Reclassifying...
                </>
              ) : (
                <>🔄 Reclassify with AI</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Feed Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>🌀</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>No feedback found.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Try removing filters, searching other terms, or ingesting feedback.
            </p>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    {!isReadOnly && (
                      <th style={{ width: '36px' }}>
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          disabled={reclassifying}
                          title="Select all on this page"
                        />
                      </th>
                    )}
                    <th style={{ width: '40%' }}>Feedback Content</th>
                    <th>Source</th>
                    <th>Sentiment</th>
                    <th>Theme</th>
                    <th style={{ width: '130px' }}>Status</th>
                    <th>Date</th>
                    {!isReadOnly && <th style={{ width: '80px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr key={f.id} style={{ backgroundColor: selectedIds.has(f.id) ? 'rgba(99, 102, 241, 0.06)' : undefined }}>
                      {!isReadOnly && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(f.id)}
                            onChange={() => toggleSelected(f.id)}
                            disabled={reclassifying}
                          />
                        </td>
                      )}
                      <td style={{ lineHeight: '1.5', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13.5px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{f.content}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Customer: <span style={{ color: 'var(--text-secondary)' }}>{f.customerLabel || 'Anonymous'}</span>
                        </div>
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
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {f.Themes && f.Themes.length > 0 ? (
                            f.Themes.map((t) => (
                              <span 
                                key={t.id} 
                                className="badge" 
                                style={{ 
                                  backgroundColor: `${t.color || '#6366f1'}20`, 
                                  color: t.color || '#6366f1',
                                  border: `1px solid ${t.color || '#6366f1'}40`
                                }}
                              >
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {isReadOnly ? (
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: f.status === 'ACTIONED' ? 'rgba(16, 185, 129, 0.15)' : f.status === 'REVIEWED' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: f.status === 'ACTIONED' ? '#10b981' : f.status === 'REVIEWED' ? '#6366f1' : 'var(--text-secondary)',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            {f.status}
                          </span>
                        ) : (
                          <select 
                            value={f.status} 
                            disabled={statusUpdatingId === f.id}
                            onChange={(e) => handleStatusChange(f.id, e.target.value)}
                            style={{ 
                              padding: '6px 10px', 
                              fontSize: '12px', 
                              width: '100%', 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              borderColor: statusUpdatingId === f.id ? 'var(--color-primary)' : 'var(--border-light)'
                            }}
                          >
                            <option value="NEW">NEW</option>
                            <option value="REVIEWED">REVIEWED</option>
                            <option value="ACTIONED">ACTIONED</option>
                          </select>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {formatDate(f.createdAt)}
                      </td>
                      {!isReadOnly && (
                        <td>
                          <button 
                            onClick={() => handleDelete(f.id)} 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing <strong>{showingStart}</strong>–<strong>{showingEnd}</strong> of <strong>{pagination.total}</strong> feedback items
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: page - 1 })}
                >
                  ← Previous
                </button>
                
                {renderPageNumbers()}

                <button 
                  className="pagination-btn"
                  disabled={page >= pagination.totalPages}
                  onClick={() => updateParams({ page: page + 1 })}
                >
                  Next →
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