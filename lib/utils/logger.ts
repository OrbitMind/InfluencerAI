const IS_PROD = process.env.NODE_ENV === 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = Record<string, unknown>;

export interface Logger {
  debug(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, data?: LogData): void;
}

function formatError(data?: LogData): LogData | undefined {
  if (!data) return undefined;
  const formatted: LogData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Error) {
      formatted[key] = { message: value.message, name: value.name };
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
}

function log(level: LogLevel, context: string, message: string, data?: LogData): void {
  if (IS_PROD && (level === 'debug' || level === 'info')) return;

  const entry = {
    level,
    context,
    message,
    ...(data ? formatError(data) : {}),
    timestamp: new Date().toISOString(),
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function createLogger(context: string): Logger {
  return {
    debug: (message, data) => log('debug', context, message, data),
    info:  (message, data) => log('info',  context, message, data),
    warn:  (message, data) => log('warn',  context, message, data),
    error: (message, data) => log('error', context, message, data),
  };
}
