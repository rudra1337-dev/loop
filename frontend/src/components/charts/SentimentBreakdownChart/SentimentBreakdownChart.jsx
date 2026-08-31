import "./SentimentBreakdownChart.css";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const SentimentBreakdownChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '24px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
      </div>
    );
  }

  const total = (data?.POS || 0) + (data?.NEU || 0) + (data?.NEG || 0);

  if (total === 0) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        No feedback data to analyze.
      </div>
    );
  }

  const chartData = [
    { name: 'Positive', value: data?.POS || 0, color: 'var(--color-pos)' },
    { name: 'Neutral', value: data?.NEU || 0, color: 'var(--color-neu)' },
    { name: 'Negative', value: data?.NEG || 0, color: 'var(--color-neg)' }
  ].filter(item => item.value > 0);



  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pct = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div className="glass-card" style={{ padding: '8px 12px', margin: 0, border: `1px solid ${payload[0].payload.color}40`, background: 'rgba(15, 22, 42, 0.95)' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: payload[0].payload.color }}>
            {payload[0].name}: {payload[0].value} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sentiment-chart-container">
      <div className="sentiment-chart-visual">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="sentiment-chart-legend">
        {chartData.map((entry, index) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={`item-${index}`} className="sentiment-legend-item">
              <div className="sentiment-legend-color-dot" style={{ backgroundColor: entry.color }} />
              <span className="sentiment-legend-name">{entry.name}</span>
              <span className="sentiment-legend-value">{entry.value}</span>
              <span className="sentiment-legend-pct">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SentimentBreakdownChart;
