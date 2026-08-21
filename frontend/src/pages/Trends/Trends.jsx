import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTrends } from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './Trends.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dateObj = new Date(payload[0].payload.date);
    const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return (
      <div className="glass-card trends-tooltip-card">
        <p className="trends-tooltip-date">{formattedDate}</p>
        {payload.map((entry, index) => (
          <p key={index} className="trends-tooltip-entry" style={{ color: entry.stroke || 'var(--text-primary)' }}>
            <span className="trends-tooltip-bullet">●</span>
            {entry.name}: <strong>{entry.value}</strong> {entry.value === 1 ? 'feedback' : 'feedbacks'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Trends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const period = searchParams.get('period') || '30d';
  
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const loadTrends = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getTrends({ period });
        if (res.data.success) {
          setTrendsData(res.data);
        } else {
          setError(res.data.error || 'Failed to retrieve trends');
        }
      } catch (err) {
        console.error('Error loading trends:', err);
        setError(err.response?.data?.error || 'Failed to retrieve feedback trends.');
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, [period]);

  const handlePeriodChange = (value) => {
    updateParams({ period: value });
  };

  const handleThemeClick = (themeName) => {
    navigate(`/feedback?theme=${encodeURIComponent(themeName)}`);
  };

  // Extract themes
  const themes = trendsData?.themes || [];
  
  // Check if there is any feedback at all in the active themes
  const totalFeedbackCount = themes.reduce((acc, t) => acc + t.currentCount + t.previousCount, 0);

  // Filter top themes for the chart to prevent clutter (max 5)
  const topThemesForChart = [...themes]
    .sort((a, b) => b.currentCount - a.currentCount)
    .slice(0, 5);

  // Transform daily volume data for Recharts LineChart
  const transformChartData = () => {
    if (topThemesForChart.length === 0) return [];
    
    const dates = topThemesForChart[0].dailyVolume.map(v => v.date);
    
    return dates.map(date => {
      const dateObj = new Date(date);
      const displayDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const row = { date, displayDate };
      
      topThemesForChart.forEach(t => {
        const volEntry = t.dailyVolume.find(v => v.date === date);
        row[t.themeName] = volEntry ? volEntry.count : 0;
      });
      
      return row;
    });
  };

  const chartData = transformChartData();

  // Sort themes for rendering lists: Spiking first, then by currentCount
  const sortedThemes = [...themes].sort((a, b) => {
    if (a.isSpiking && !b.isSpiking) return -1;
    if (!a.isSpiking && b.isSpiking) return 1;
    return b.currentCount - a.currentCount;
  });

  const spikingThemesCount = themes.filter(t => t.isSpiking).length;

  return (
    <div>
      {/* Page Header */}
      <div className="trends-header-row">
        <div>
          <h1 className="trends-header-title">Trends</h1>
          <p className="subtitle trends-header-subtitle">
            Identify which customer feedback themes are emerging and spiking compared to the previous period
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => updateParams({ _ref: Date.now() })} 
            className="btn btn-secondary trends-refresh-btn" 
            title="Refresh trends data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Period Selection Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="trends-period-select-container">
            <label className="form-label">Comparison Period</label>
            <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
              <option value="7d">Last 7 Days (vs previous 7 days)</option>
              <option value="30d">Last 30 Days (vs previous 30 days)</option>
              <option value="90d">Last 90 Days (vs previous 90 days)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span>❌</span> {error}
        </div>
      )}

      {loading ? (
        // Loading State
        <div className="glass-card trends-loading-container">
          <div className="trends-loading-spinner">🌀</div>
          <h3>Analyzing feedback trends...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Calculating theme volume comparisons and identifying spikes.</p>
        </div>
      ) : themes.length === 0 ? (
        // Empty State: No themes exist
        <div className="glass-card trends-empty-container">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <h2>No themes found</h2>
          <p className="subtitle" style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
            There are no feedback themes defined in this workspace yet. Make sure you have ingested categorized feedback.
          </p>
        </div>
      ) : totalFeedbackCount === 0 ? (
        // Empty State: Feedback exists but count is zero
        <div className="glass-card trends-empty-container">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h2>No feedback data available yet</h2>
          <p className="subtitle" style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
            We couldn't find any feedback comments matching this period. Try changing your comparison period or ingesting more feedback.
          </p>
        </div>
      ) : (
        <>
          {/* Trends Summary Stats */}
          <div className="metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="metric-card">
              <span className="metric-title">Spiking Themes</span>
              <span className="metric-value" style={{ color: spikingThemesCount > 0 ? 'var(--color-neg)' : 'var(--text-primary)' }}>
                {spikingThemesCount}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Themes with &ge; 30% volume increase
              </span>
            </div>
            
            <div className="metric-card">
              <span className="metric-title">Total Active Themes</span>
              <span className="metric-value">{themes.filter(t => t.currentCount > 0).length}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Themes receiving feedback recently
              </span>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card trends-chart-card">
            <h2>Theme Volume Over Time</h2>
            <p className="subtitle" style={{ marginBottom: '24px' }}>
              Daily volume trend for top 5 active themes in the current period
            </p>
            <div className="trends-chart-wrapper">
              {chartData.length === 0 ? (
                <div className="trends-chart-empty-state">
                  No trend data to plot.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} 
                    />
                    {topThemesForChart.map((theme) => (
                      <Line
                        key={theme.themeId}
                        type="monotone"
                        dataKey={theme.themeName}
                        name={theme.themeName}
                        stroke={theme.color || '#6366f1'}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1.5 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Themes Trend Grid/List */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>Theme Performance Details</h2>
            {spikingThemesCount === 0 ? (
              <div className="badge badge-neu trends-spiking-notice">
                ℹ️ No themes are currently spiking.
              </div>
            ) : null}
            
            <div className="trends-cards-grid">
              {sortedThemes.map(theme => {
                const isPositive = theme.pctChange > 0;
                const isNegative = theme.pctChange < 0;
                
                return (
                  <div 
                    key={theme.themeId}
                    className="glass-card trend-theme-card" 
                    tabIndex={0}
                    style={{ 
                      border: theme.isSpiking ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)',
                      boxShadow: theme.isSpiking ? '0 0 16px rgba(239, 68, 68, 0.1)' : 'none',
                    }}
                    onClick={() => handleThemeClick(theme.themeName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleThemeClick(theme.themeName);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.isSpiking ? 'rgba(239, 68, 68, 0.8)' : 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.isSpiking ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-light)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="trend-theme-card-header">
                      <div className="trend-theme-title-container">
                        <span 
                          className="trend-theme-dot"
                          style={{ 
                            backgroundColor: theme.color || '#6366f1',
                          }} 
                        />
                        <h3 className="trend-theme-title">
                          {theme.themeName}
                        </h3>
                      </div>
                      
                      {theme.isSpiking && (
                        <span className="badge trend-theme-spiking-badge">
                          🔥 Spiking
                        </span>
                      )}
                    </div>

                    <div className="trend-theme-card-body">
                      <div>
                        <div className="trend-theme-stat-value">
                          {theme.currentCount}
                        </div>
                        <div className="trend-theme-stat-label">
                          Feedbacks this period
                        </div>
                        <div className="trend-theme-stat-prev">
                          Previous period: <strong>{theme.previousCount}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span 
                          className="trend-theme-pct-change"
                          style={{ 
                            color: theme.isSpiking || isPositive ? '#10b981' : isNegative ? '#ef4444' : 'var(--text-secondary)'
                          }}
                        >
                          {theme.pctChange > 0 ? `+${theme.pctChange}%` : `${theme.pctChange}%`}
                        </span>
                        <div className="trend-theme-change-label">
                          vs previous period
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Trends;
