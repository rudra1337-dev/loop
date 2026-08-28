import './Skeleton.css';

/**
 * Basic pulsing block for custom skeleton layouts.
 */
export const SkeletonBlock = ({
  width = '100%',
  height = '16px',
  borderRadius,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

/**
 * Metric Card Skeleton.
 */
export const SkeletonMetric = () => {
  return (
    <div className="skeleton-metric-card" role="progressbar" aria-busy="true" aria-label="Loading metric">
      <SkeletonBlock className="skeleton-metric-title" height="12px" width="50%" />
      <SkeletonBlock className="skeleton-metric-value" height="28px" width="35%" style={{ margin: '8px 0' }} />
      <SkeletonBlock className="skeleton-metric-subtitle" height="10px" width="65%" />
    </div>
  );
};

/**
 * Chart Skeleton for area, pie, or bar charts.
 */
export const SkeletonChart = ({ type = 'line' }) => {
  return (
    <div className="skeleton-chart-card" role="progressbar" aria-busy="true" aria-label="Loading chart analytics">
      <SkeletonBlock className="skeleton-chart-header" height="20px" width="40%" />
      <SkeletonBlock className="skeleton-chart-subtitle" height="12px" width="60%" style={{ marginTop: '8px', marginBottom: '24px' }} />
      
      {type === 'pie' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
          <SkeletonBlock height="160px" width="160px" borderRadius="50%" />
        </div>
      ) : (
        <div className="skeleton-chart-body">
          <SkeletonBlock className="skeleton-chart-bar" height="30%" />
          <SkeletonBlock className="skeleton-chart-bar" height="65%" />
          <SkeletonBlock className="skeleton-chart-bar" height="45%" />
          <SkeletonBlock className="skeleton-chart-bar" height="85%" />
          <SkeletonBlock className="skeleton-chart-bar" height="60%" />
          <SkeletonBlock className="skeleton-chart-bar" height="95%" />
          <SkeletonBlock className="skeleton-chart-bar" height="40%" />
        </div>
      )}
    </div>
  );
};

/**
 * Table Skeleton for lists like Feedback Explorer.
 */
export const SkeletonTable = ({ rows = 5, showCheckbox = true, showActions = true }) => {
  return (
    <div className="skeleton-table-container" role="progressbar" aria-busy="true" aria-label="Loading table records">
      <div className="skeleton-table-header">
        {showCheckbox && <SkeletonBlock className="skeleton-col-checkbox" />}
        <SkeletonBlock height="12px" width="25%" />
        <SkeletonBlock height="12px" width="10%" />
        <SkeletonBlock height="12px" width="12%" />
        <SkeletonBlock height="12px" width="12%" />
        <SkeletonBlock height="12px" width="10%" />
        <SkeletonBlock height="12px" width="10%" />
        {showActions && <SkeletonBlock height="12px" width="8%" />}
      </div>
      
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton-table-row">
          {showCheckbox && <SkeletonBlock className="skeleton-col-checkbox" />}
          
          <div className="skeleton-col-content">
            <SkeletonBlock height="14px" width="85%" />
            <SkeletonBlock height="10px" width="40%" />
          </div>
          
          <div className="skeleton-col-source">
            <SkeletonBlock height="14px" width="70%" />
          </div>
          
          <div className="skeleton-col-sentiment">
            <SkeletonBlock height="20px" width="80%" borderRadius="10px" />
          </div>
          
          <div className="skeleton-col-theme">
            <SkeletonBlock height="18px" width="60%" borderRadius="4px" />
          </div>
          
          <div className="skeleton-col-status">
            <SkeletonBlock height="24px" width="90%" borderRadius="6px" />
          </div>
          
          <div className="skeleton-col-date">
            <SkeletonBlock height="12px" width="80%" />
          </div>
          
          {showActions && (
            <div className="skeleton-col-action">
              <SkeletonBlock height="24px" width="100%" borderRadius="6px" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
