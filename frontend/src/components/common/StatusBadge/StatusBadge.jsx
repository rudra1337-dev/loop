import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = (statusStr) => {
    switch (statusStr?.toUpperCase()) {
      case 'NEW':
        return 'badge-new';
      case 'REVIEWED':
        return 'badge-reviewed';
      case 'ACTIONED':
        return 'badge-actioned';
      default:
        return 'badge-neu';
    }
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {status || 'UNKNOWN'}
    </span>
  );
};

export default StatusBadge;
