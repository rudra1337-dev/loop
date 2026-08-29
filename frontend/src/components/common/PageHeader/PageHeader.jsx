import './PageHeader.css';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="page-header-container">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="subtitle page-header-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
};

export default PageHeader;
