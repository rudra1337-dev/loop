import './EmptyState.css';

const EmptyState = ({ icon = '📊', title, description, children }) => {
  return (
    <div className="glass-card empty-state-container">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h2 className="empty-state-title">{title}</h2>
      {description && <p className="subtitle empty-state-desc">{description}</p>}
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  );
};

export default EmptyState;
