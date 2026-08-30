// Centralized observability logger

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Default level to WARN in production, DEBUG in development
const CURRENT_LEVEL = import.meta.env?.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

const formatMessage = (level, message, context) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    ...(context ? { context } : {}),
  };
};

const printLog = (levelName, levelValue, message, context) => {
  if (levelValue < CURRENT_LEVEL) return;

  const logObj = formatMessage(levelName, message, context);
  const prefix = `[LOOP] [${logObj.timestamp}] [${logObj.level}]:`;

  switch (levelName) {
    case 'DEBUG':
      console.debug(prefix, logObj.message, logObj.context || '');
      break;
    case 'INFO':
      console.info(prefix, logObj.message, logObj.context || '');
      break;
    case 'WARN':
      console.warn(prefix, logObj.message, logObj.context || '');
      break;
    case 'ERROR':
      console.error(prefix, logObj.message, logObj.context || '');
      // Observability hook (e.g. Sentry/datadog integration point)
      break;
    default:
      console.log(prefix, logObj.message, logObj.context || '');
  }
};

const logger = {
  debug: (message, context) => printLog('DEBUG', LOG_LEVELS.DEBUG, message, context),
  info: (message, context) => printLog('INFO', LOG_LEVELS.INFO, message, context),
  warn: (message, context) => printLog('WARN', LOG_LEVELS.WARN, message, context),
  error: (message, context) => printLog('ERROR', LOG_LEVELS.ERROR, message, context),
};

export default logger;
