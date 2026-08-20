import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '12px 16px', margin: 0, border: '1px solid var(--border-hover)', background: 'rgba(15, 22, 42, 0.95)' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{payload[0].payload.name}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: payload[0].payload.color }}>
          Volume: <strong>{payload[0].value}</strong> feedback items
        </p>
      </div>
    );
  }
  return null;
};

const TopThemesChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '24px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        No themes recorded for active filters.
      </div>
    );
  }

  // Sort themes in descending order
  const chartData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <XAxis 
            type="number" 
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="var(--text-primary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]}
            barSize={16}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || '#6366f1'} 
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopThemesChart;
