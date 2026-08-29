import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTrends } from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader/PageHeader';
import ErrorState from '../../components/common/ErrorState/ErrorState';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './Trends.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dateObj = new Date(payload[0].payload.date);

    const formattedDate = dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });

    return (
      <div className="glass-card trends-tooltip-card">
        <p className="trends-tooltip-date">
          {formattedDate}
        </p>

        {payload.map((entry, index) => (
          <p
            key={index}
            className="trends-tooltip-entry"
            style={{
              color: entry.stroke || 'var(--text-primary)'
            }}
          >
            <span className="trends-tooltip-bullet">●</span>
            {entry.name}: <strong>{entry.value}</strong>{' '}
            {entry.value === 1 ? 'feedback' : 'feedbacks'}
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

  /*
   * Load trends data.
   *
   * Using useCallback keeps the function stable until `period`
   * changes and allows the Refresh button to call it directly.
   */
  const loadTrends = useCallback(async () => {
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

      setError(
        err.response?.data?.error ||
        'Failed to retrieve feedback trends.'
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  /*
   * Update URL query parameters without removing
   * the parameters that are already present.
   */
  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };

    Object.keys(updated).forEach((key) => {
      if (
        updated[key] === undefined ||
        updated[key] === null ||
        updated[key] === ''
      ) {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  };

  const handlePeriodChange = (value) => {
    updateParams({ period: value });
  };

  const handleThemeClick = (themeName) => {
    navigate(`/feedback?theme=${encodeURIComponent(themeName)}`);
  };

  // Extract themes
  const themes = trendsData?.themes || [];

  // Check if there is any feedback at all in the active themes
  const totalFeedbackCount = themes.reduce(
    (acc, theme) =>
      acc + theme.currentCount + theme.previousCount,
    0
  );

  // Filter top themes for the chart to prevent clutter
  const topThemesForChart = [...themes]
    .sort((a, b) => b.currentCount - a.currentCount)
    .slice(0, 5);

  // Transform daily volume data for Recharts LineChart
  const transformChartData = () => {
    if (topThemesForChart.length === 0) {
      return [];
    }

    const dates = topThemesForChart[0].dailyVolume.map(
      (volume) => volume.date
    );

    return dates.map((date) => {
      const dateObj = new Date(date);

      const displayDate = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });

      const row = {
        date,
        displayDate
      };

      topThemesForChart.forEach((theme) => {
        const volumeEntry = theme.dailyVolume.find(
          (volume) => volume.date === date
        );

        row[theme.themeName] = volumeEntry
          ? volumeEntry.count
          : 0;
      });

      return row;
    });
  };

  const chartData = transformChartData();

  // Sort themes for rendering lists:
  // Spiking first, then by currentCount
  const sortedThemes = [...themes].sort((a, b) => {
    if (a.isSpiking && !b.isSpiking) return -1;
    if (!a.isSpiking && b.isSpiking) return 1;

    return b.currentCount - a.currentCount;
  });

  const spikingThemesCount = themes.filter(
    (theme) => theme.isSpiking
  ).length;

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Trends"
        subtitle="Identify which customer feedback themes are emerging and spiking compared to the previous period"
      />

      {/* Period Selection Toolbar */}
      <div className="glass-card trends-period-toolbar">
        <div className="trends-period-toolbar-inner">
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

      {/* Error State */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => loadTrends()}
        />
      )}

      {/* Loading State */}
      {loading ? (
        <div className="glass-card trends-loading-container">
          <div className="trends-loading-spinner">🌀</div>
          <h3>Analyzing feedback trends...</h3>
          <p className="trends-loading-description">
            Calculating theme volume comparisons and identifying spikes.
          </p>
        </div>
      ) : themes.length === 0 ? (
        /* Empty State: No themes exist */
        <EmptyState
          icon="📈"
          title="No themes found"
          description="There are no feedback themes defined in this workspace yet. Make sure you have ingested categorized feedback."
        />
      ) : totalFeedbackCount === 0 ? (
        /* Empty State: Feedback exists but count is zero */
        <EmptyState
          icon="📭"
          title="No feedback data available yet"
          description="We couldn't find any feedback comments matching this period. Try changing your comparison period or ingesting more feedback."
        />
      ) : (
        <>
          {/* Trends Summary Stats */}
          <div className="metrics-grid trends-metrics-grid">
            <div className="metric-card">
              <span className="metric-title">
                Spiking Themes
              </span>

              <span
                className={`metric-value ${
                  spikingThemesCount > 0
                    ? 'trends-spiking-metric'
                    : ''
                }`}
              >
                {spikingThemesCount}
              </span>

              <span className="trends-metric-description">
                Themes with &ge; 30% volume increase
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-title">
                Total Active Themes
              </span>

              <span className="metric-value">
                {
                  themes.filter(
                    (theme) => theme.currentCount > 0
                  ).length
                }
              </span>

              <span className="trends-metric-description">
                Themes receiving feedback recently
              </span>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card trends-chart-card">
            <h2>
              Theme Volume Over Time
            </h2>

            <p className="subtitle trends-chart-subtitle">
              Daily volume trend for top 5 active themes in
              the current period
            </p>

            <div className="trends-chart-wrapper">
              {chartData.length === 0 ? (
                <div className="trends-chart-empty-state">
                  No trend data to plot.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: -20,
                      bottom: 0
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.05)"
                      vertical={false}
                    />

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

                    <Tooltip
                      content={<CustomTooltip />}
                    />

                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    />

                    {topThemesForChart.map((theme) => (
                      <Line
                        key={theme.themeId}
                        type="monotone"
                        dataKey={theme.themeName}
                        name={theme.themeName}
                        stroke={
                          theme.color || '#6366f1'
                        }
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          strokeWidth: 1.5
                        }}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2
                        }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Themes Trend Grid/List */}
          <div>
            <h2 className="trends-performance-title">
              Theme Performance Details
            </h2>

            {spikingThemesCount === 0 ? (
              <div className="badge badge-neu trends-spiking-notice">
                ℹ️ No themes are currently spiking.
              </div>
            ) : null}

            <div className="trends-cards-grid">
              {sortedThemes.map((theme) => {
                const isPositive = theme.pctChange > 0;
                const isNegative = theme.pctChange < 0;

                return (
                  <div
                    key={theme.themeId}
                    className={`glass-card trend-theme-card ${
                      theme.isSpiking
                        ? 'trend-theme-card-spiking'
                        : ''
                    }`}
                    tabIndex={0}
                    onClick={() =>
                      handleThemeClick(theme.themeName)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' ||
                        e.key === ' '
                      ) {
                        e.preventDefault();

                        handleThemeClick(
                          theme.themeName
                        );
                      }
                    }}
                  >
                    {/* Theme Card Header */}
                    <div className="trend-theme-card-header">
                      <div className="trend-theme-title-container">
                        <span
                          className="trend-theme-dot"
                          style={{
                            backgroundColor:
                              theme.color || '#6366f1'
                          }}
                        />

                        <h3 className="trend-theme-title">
                          {theme.themeName}
                        </h3>
                      </div>

                      {/* New / Spiking Badge */}
                      {theme.isSpiking &&
                      theme.isNewActivity ? (
                        <span className="badge trend-theme-new-badge">
                          🆕 New
                        </span>
                      ) : theme.isSpiking ? (
                        <span className="badge trend-theme-spiking-badge">
                          🔥 Spiking
                        </span>
                      ) : null}
                    </div>

                    {/* Theme Card Body */}
                    <div className="trend-theme-card-body">
                      <div>
                        <div className="trend-theme-stat-value">
                          {theme.currentCount}
                        </div>

                        <div className="trend-theme-stat-label">
                          Feedbacks this period
                        </div>

                        <div className="trend-theme-stat-prev">
                          Previous period:{' '}
                          <strong>
                            {theme.previousCount}
                          </strong>
                        </div>
                      </div>

                      <div className="trend-theme-change-container">
                        <span
                          className={`trend-theme-pct-change ${
                            theme.isSpiking ||
                            isPositive
                              ? 'trend-theme-pct-positive'
                              : isNegative
                              ? 'trend-theme-pct-negative'
                              : 'trend-theme-pct-neutral'
                          }`}
                        >
                          {theme.pctChange > 0
                            ? `+${theme.pctChange}%`
                            : `${theme.pctChange}%`}
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