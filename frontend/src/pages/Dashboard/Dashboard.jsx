import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getStats, getThemes } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';

// Chart components
import FeedbackVolumeChart from '../components/charts/FeedbackVolumeChart';
import SentimentBreakdownChart from '../components/charts/SentimentBreakdownChart';
import TopThemesChart from '../components/charts/TopThemesChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Filter States synced with URL Search Parameters
  const dateRange = searchParams.get('dateRange') || '30d';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const channel = searchParams.get('channel') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const status = searchParams.get('status') || '';
  const theme = searchParams.get('theme') || '';

  // 2. Options Lists
  const [themesList, setThemesList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local inputs for custom dates to avoid querying instantly while typing
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);

  // Sync inputs with url parameters
  useEffect(() => {
    setFromInput(from);
  }, [from]);

  useEffect(() => {
    setToInput(to);
  }, [to]);

  // Load themes list once
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const res = await getThemes();
        if (res.data.success) {
          setThemesList(res.data.themes || []);
        }
      } catch (err) {
        console.error('Failed to load themes for dashboard filters:', err);
      }
    };
    loadThemes();
  }, []);

  // Update query params in URL
  const updateParams = useCallback((newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };

    // Clean up empty params
    Object.keys(updated).forEach(key => {
      if (updated[key] === undefined || updated[key] === null || updated[key] === '') {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  }, [searchParams, setSearchParams]);

  // Handle Date Range Selection
  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      updateParams({ dateRange: 'custom', from: fromInput, to: toInput });
    } else {
      // Calculate from and to based on selections
      let fromDate = '';
      const toDate = new Date().toISOString().split('T')[0];

      if (value === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString().split('T')[0];
      } else if (value === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        fromDate = d.toISOString().split('T')[0];
      } else if (value === '90d') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        fromDate = d.toISOString().split('T')[0];
      }

      updateParams({
        dateRange: value,
        from: fromDate,
        to: value === 'all' ? '' : toDate
      });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchParams({ dateRange: '30d' });
    setFromInput('');
    setToInput('');
  };

  // Load stats whenever searchParams update
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {
          channel,
          sentiment,
          status,
          theme,
          from,
          to
        };

        const res = await getStats(params);
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError('Failed to retrieve feedback stats. Try adjusting date ranges or filters.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [channel, sentiment, status, theme, from, to]);

  // Sentiment Glow Helper
  const getSentimentGlow = (score) => {
    const num = parseFloat(score || 0);
    if (num > 0.15) return 'rgba(16, 185, 129, 0.25)';
    if (num < -0.15) return 'rgba(239, 68, 68, 0.25)';
    return 'rgba(245, 158, 11, 0.25)';
  };

  const getSentimentColorClass = (score) => {
    const num = parseFloat(score || 0);
    if (num > 0.15) return 'var(--color-pos)';
    if (num < -0.15) return 'var(--color-neg)';
    return 'var(--color-neu)';
  };

  // Build Explorer query parameters to match active dashboard filters
  const explorerQueryString = () => {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (sentiment) params.set('sentiment', sentiment);
    if (status) params.set('status', status);
    if (theme) params.set('theme', theme);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString() ? `?${params.toString()}` : '';
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Feedback Analytics</h1>
          <p className="subtitle" style={{ margin: '4px 0 0 0' }}>
            Intelligent customer feedback insights for {user?.workspaceName || 'your workspace'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => updateParams({ _ref: Date.now() })} 
            className="btn btn-secondary" 
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Refresh dashboard stats"
          >
            🔄 Refresh
          </button>
          <Link to="/ingestion" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            📥 Ingest Feedback
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 180px' }}>
            <label className="form-label">Date Range</label>
            <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)}>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div style={{ flex: '1 1 130px' }}>
                <label className="form-label">From</label>
                <input 
                  type="date" 
                  value={fromInput} 
                  onChange={(e) => { setFromInput(e.target.value); updateParams({ from: e.target.value }); }} 
                />
              </div>
              <div style={{ flex: '1 1 130px' }}>
                <label className="form-label">To</label>
                <input 
                  type="date" 
                  value={toInput} 
                  onChange={(e) => { setToInput(e.target.value); updateParams({ to: e.target.value }); }} 
                />
              </div>
            </>
          )}

          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label">Channel</label>
            <select value={channel} onChange={(e) => updateParams({ channel: e.target.value })}>
              <option value="">All Channels</option>
              <option value="Slack Chat">Slack Chat</option>
              <option value="Support Email">Support Email</option>
              <option value="API">REST API</option>
              <option value="CSV Import">CSV Import</option>
              <option value="Client Call">Client Call</option>
              <option value="Intercom Chat">Intercom Chat</option>
              <option value="Play Store Review">Play Store Review</option>
            </select>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label className="form-label">Sentiment</label>
            <select value={sentiment} onChange={(e) => updateParams({ sentiment: e.target.value })}>
              <option value="">All Sentiments</option>
              <option value="POS">Positive (POS)</option>
              <option value="NEU">Neutral (NEU)</option>
              <option value="NEG">Negative (NEG)</option>
            </select>
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label">Theme</label>
            <select value={theme} onChange={(e) => updateParams({ theme: e.target.value })}>
              <option value="">All Themes</option>
              {themesList.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label className="form-label">Status</label>
            <select value={status} onChange={(e) => updateParams({ status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="ACTIONED">ACTIONED</option>
            </select>
          </div>

          <div>
            <button 
              onClick={handleResetFilters} 
              className="btn btn-secondary" 
              style={{ padding: '0 16px', height: '42px', whiteSpace: 'nowrap' }}
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span>❌</span> {error}
        </div>
      )}

      {/* KPI metrics cards grid */}
      <div className="metrics-grid">
        {/* Card 1: Total Feedback */}
        <div className="metric-card">
          <span className="metric-title">Total Feedback</span>
          <span className="metric-value">{loading ? '...' : stats?.total || 0}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Matching active filters
          </span>
        </div>

        {/* Card 2: Negative Percentage */}
        <div className="metric-card">
          <span className="metric-title">Negative Ratio</span>
          <span className="metric-value" style={{ color: !loading && stats?.negativePercentage > 25 ? 'var(--color-neg)' : 'var(--text-primary)' }}>
            {loading ? '...' : `${stats?.negativePercentage || 0}%`}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Percentage categorized NEG
          </span>
        </div>

        {/* Card 3: New This Week */}
        <div className="metric-card">
          <span className="metric-title">New This Week</span>
          <span className="metric-value">{loading ? '...' : stats?.newThisWeek || 0}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Created in last 7 days
          </span>
        </div>

        {/* Card 4: Average Sentiment */}
        <div 
          className="metric-card" 
          style={{ 
            boxShadow: loading ? 'none' : `0 0 16px ${getSentimentGlow(stats?.averageSentimentScore || 0)}`,
            border: loading ? '1px solid var(--border-light)' : `1px solid ${getSentimentGlow(stats?.averageSentimentScore || 0)}`
          }}
        >
          <span className="metric-title">Avg Sentiment</span>
          <span className="metric-value" style={{ color: loading ? 'var(--text-primary)' : getSentimentColorClass(stats?.averageSentimentScore || 0) }}>
            {loading ? '...' : (parseFloat(stats?.averageSentimentScore || 0) > 0 ? '+' : '') + (stats?.averageSentimentScore || '0.00')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scale: -1.00 (NEG) to +1.00 (POS)
          </span>
        </div>
      </div>

      {/* Main Charts Layout */}
      {!loading && stats?.total === 0 ? (
        // Empty State
        <div className="glass-card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h2>No matching feedback found</h2>
          <p className="subtitle" style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
            There are no feedback records for the selected filters. Try broadening your date range, removing channel filters, or ingesting more data.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Clear All Filters
            </button>
            <Link to="/ingestion" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Ingest Simulated Data
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Row 1: Volume (2/3 width) and Sentiment (1/3 width) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px', marginBottom: '24px' }}>
            
            <div className="glass-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <h2>Feedback Volume Over Time</h2>
              <p className="subtitle" style={{ marginBottom: '16px' }}>Dynamic trend matching active query filters</p>
              <div style={{ marginTop: 'auto' }}>
                <FeedbackVolumeChart data={stats?.trend || []} loading={loading} />
              </div>
            </div>

            <div className="glass-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <h2>Sentiment Distribution</h2>
              <p className="subtitle" style={{ marginBottom: '16px' }}>Percentage rating ratio by Gemini AI</p>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SentimentBreakdownChart data={stats?.sentiment} loading={loading} />
              </div>
            </div>

          </div>

          {/* Charts Row 2: Top Themes and Ingest Channels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>
            
            <div className="glass-card" style={{ margin: 0 }}>
              <h2>Top Themes Frequency</h2>
              <p className="subtitle" style={{ marginBottom: '16px' }}>Themes assigned to customer comments sorted by frequency</p>
              <TopThemesChart data={stats?.topThemes || []} loading={loading} />
            </div>

            <div className="glass-card" style={{ margin: 0 }}>
              <h2>Ingestion Source Volumes</h2>
              <p className="subtitle" style={{ marginBottom: '16px' }}>Feedback density across communication channels</p>
              
              {/* Channels list or simple channels grid */}
              {!loading && stats?.channels && stats.channels.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.channels.map((chan) => (
                    <div 
                      key={chan.channel} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-light)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px' }}>
                          {chan.channel.toLowerCase().includes('slack') ? '💬' : 
                           chan.channel.toLowerCase().includes('email') ? '✉️' : 
                           chan.channel.toLowerCase().includes('csv') ? '📄' : '⚙️'}
                        </span>
                        <span style={{ fontWeight: '500', fontSize: '13.5px' }}>{chan.channel}</span>
                      </div>
                      <span className="badge badge-neu" style={{ color: 'var(--text-primary)', border: 'none', background: 'rgba(255, 255, 255, 0.08)' }}>
                        {chan.count} items
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                  No channels record found.
                </p>
              )}
            </div>

          </div>

          {/* Drilldown Quick Link */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))', borderColor: 'var(--border-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '28px' }}>🔍</div>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Want to explore these feedback records?</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Drill down and inspect the exact customer comments behind these metrics. Your current filters will remain applied!
                </p>
              </div>
              <Link 
                to={`/feedback${explorerQueryString()}`} 
                className="btn btn-primary" 
                style={{ textDecoration: 'none', padding: '10px 20px', marginLeft: 'auto' }}
              >
                Inspect in Feedback Explorer →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
