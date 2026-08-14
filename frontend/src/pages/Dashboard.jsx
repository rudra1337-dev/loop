import { useState, useEffect } from 'react';
import { getStats } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Could not load feedback stats. Please ingest some feedback first!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite' }}>🌀</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading intelligent analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate percentages
  const total = stats?.total || 0;
  const posPct = total > 0 ? Math.round((stats.sentiment.POS / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((stats.sentiment.NEU / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((stats.sentiment.NEG / total) * 100) : 0;

  // Sentiment color helper
  const getSentimentGlow = (score) => {
    if (score > 0.2) return 'rgba(16, 185, 129, 0.4)';
    if (score < -0.2) return 'rgba(239, 68, 68, 0.4)';
    return 'rgba(245, 158, 11, 0.4)';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Feedback Dashboard</h1>
          <p className="subtitle">AI-driven analysis of customer feedback for {user?.workspaceName}</p>
        </div>
        <Link to="/ingestion" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <span>📥</span> Ingest Feedback
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-title">Total Ingested</span>
          <span className="metric-value">{total}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all active channels
          </span>
        </div>

        <div className="metric-card" style={{ boxShadow: `0 0 16px ${getSentimentGlow(parseFloat(stats?.averageSentimentScore || 0))}` }}>
          <span className="metric-title">Average Sentiment</span>
          <span className="metric-value">
            {stats?.averageSentimentScore > 0 ? '+' : ''}{stats?.averageSentimentScore || '0.00'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scale: -1.00 (NEG) to +1.00 (POS)
          </span>
        </div>

        <div className="metric-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <span className="metric-title">Positive Feedback</span>
          <span className="metric-value" style={{ color: 'var(--color-pos)' }}>
            {stats?.sentiment.POS || 0}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {posPct}% of total volume
          </span>
        </div>

        <div className="metric-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <span className="metric-title">Negative Feedback</span>
          <span className="metric-value" style={{ color: 'var(--color-neg)' }}>
            {stats?.sentiment.NEG || 0}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {negPct}% requiring response
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>
        {/* Sentiment Distribution */}
        <div className="glass-card">
          <h2>Sentiment Distribution</h2>
          <p className="subtitle" style={{ marginBottom: '20px' }}>Breakdown of classifications computed by Gemini AI</p>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-pos)', fontWeight: '600' }}>Positive (POS)</span>
              <span>{stats?.sentiment.POS || 0} ({posPct}%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${posPct}%`, background: 'var(--color-pos)' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-neu)', fontWeight: '600' }}>Neutral (NEU)</span>
              <span>{stats?.sentiment.NEU || 0} ({neuPct}%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${neuPct}%`, background: 'var(--color-neu)' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-neg)', fontWeight: '600' }}>Negative (NEG)</span>
              <span>{stats?.sentiment.NEG || 0} ({negPct}%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${negPct}%`, background: 'var(--color-neg)' }}></div>
            </div>
          </div>
        </div>

        {/* Channels Distribution */}
        <div className="glass-card">
          <h2>Ingestion Channels</h2>
          <p className="subtitle" style={{ marginBottom: '20px' }}>Volume statistics across data sources</p>

          {stats?.channels && stats.channels.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.channels.map((chan) => (
                <div key={chan.channel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {chan.channel.toLowerCase().includes('slack') ? '💬' : 
                       chan.channel.toLowerCase().includes('email') ? '✉️' : 
                       chan.channel.toLowerCase().includes('csv') ? '📂' : '🔌'}
                    </span>
                    <span style={{ fontWeight: '500' }}>{chan.channel}</span>
                  </div>
                  <span className="badge badge-neu" style={{ color: 'var(--text-primary)', border: 'none', background: 'rgba(255, 255, 255, 0.08)' }}>
                    {chan.count} items
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
              No channel data available. Try importing some feedback.
            </p>
          )}
        </div>
      </div>

      {/* Ingestion Guidelines and Quick Access */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))', borderColor: 'var(--border-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '32px' }}>💡</div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Ready to analyze more feedback?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Ingest client feedback directly using our CSV importer or channel webhooks. Our integrated AI will classify sentiment and assign emotional scores automatically in real-time.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <Link to="/ingestion" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}>
                Go to Ingestor
              </Link>
              <Link to="/feedback" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none', background: 'transparent' }}>
                Explore Feedback
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
