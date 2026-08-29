import './DashboardFilters.css';

const DashboardFilters = ({
  dateRange,
  fromInput,
  toInput,
  setFromInput,
  setToInput,
  channel,
  sentiment,
  theme,
  status,
  themesList,
  updateParams,
  handleDateRangeChange,
  handleResetFilters,
}) => {
  return (
    <div className="glass-card filters-toolbar">
      <div className="filters-layout">
        <div className="filter-item">
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
            <div className="filter-item-custom">
              <label className="form-label">From</label>
              <input
                type="date"
                value={fromInput}
                onChange={(e) => {
                  setFromInput(e.target.value);
                  updateParams({ from: e.target.value });
                }}
              />
            </div>
            <div className="filter-item-custom">
              <label className="form-label">To</label>
              <input
                type="date"
                value={toInput}
                onChange={(e) => {
                  setToInput(e.target.value);
                  updateParams({ to: e.target.value });
                }}
              />
            </div>
          </>
        )}

        <div className="filter-item">
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

        <div className="filter-item">
          <label className="form-label">Sentiment</label>
          <select value={sentiment} onChange={(e) => updateParams({ sentiment: e.target.value })}>
            <option value="">All Sentiments</option>
            <option value="POS">Positive (POS)</option>
            <option value="NEU">Neutral (NEU)</option>
            <option value="NEG">Negative (NEG)</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">Theme</label>
          <select value={theme} onChange={(e) => updateParams({ theme: e.target.value })}>
            <option value="">All Themes</option>
            {themesList.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">Status</label>
          <select value={status} onChange={(e) => updateParams({ status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="ACTIONED">ACTIONED</option>
          </select>
        </div>

        <div className="filter-actions">
          <button onClick={handleResetFilters} className="btn btn-secondary reset-btn">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
