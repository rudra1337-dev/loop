import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dateObj = new Date(payload[0].payload.date);
    const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <div className="glass-card" style={{ padding: '12px 16px', margin: 0, border: '1px solid var(--border-hover)', background: 'rgba(15, 22, 42, 0.95)' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formattedDate}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
          {payload[0].value} {payload[0].value === 1 ? 'feedback' : 'feedbacks'}
        </p>
      </div>
    );
  }
  return null;
};

const FeedbackVolumeChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '24px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        No feedback data in this range.
      </div>
    );
  }

  // Format date labels
  const chartData = data.map(item => {
    const d = new Date(item.date);
    return {
      ...item,
      displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVolume)" 
            activeDot={{ r: 6, stroke: 'var(--bg-main)', strokeWidth: 2, fill: 'var(--color-primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeedbackVolumeChart;
