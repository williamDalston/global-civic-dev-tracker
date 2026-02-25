export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ETLLogEntry {
  timestamp: string;
  level: LogLevel;
  city: string;
  phase: 'fetch' | 'transform' | 'load' | 'sync' | 'pipeline';
  message: string;
  data?: Record<string, unknown>;
}

class ETLLogger {
  private entries: ETLLogEntry[] = [];

  log(level: LogLevel, city: string, phase: ETLLogEntry['phase'], message: string, data?: Record<string, unknown>) {
    const entry: ETLLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      city,
      phase,
      message,
      data,
    };
    this.entries.push(entry);

    const prefix = `[ETL][${city}][${phase}]`;
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'debug':
        if (process.env.ETL_DEBUG) console.debug(`${prefix} ${message}`, data || '');
        break;
      default:
        console.log(`${prefix} ${message}`, data || '');
    }
  }

  info(city: string, phase: ETLLogEntry['phase'], message: string, data?: Record<string, unknown>) {
    this.log('info', city, phase, message, data);
  }

  warn(city: string, phase: ETLLogEntry['phase'], message: string, data?: Record<string, unknown>) {
    this.log('warn', city, phase, message, data);
  }

  error(city: string, phase: ETLLogEntry['phase'], message: string, data?: Record<string, unknown>) {
    this.log('error', city, phase, message, data);
  }

  getEntries(): ETLLogEntry[] {
    return [...this.entries];
  }

  getErrors(): ETLLogEntry[] {
    return this.entries.filter((e) => e.level === 'error');
  }

  getSummary(): { total: number; errors: number; warnings: number } {
    return {
      total: this.entries.length,
      errors: this.entries.filter((e) => e.level === 'error').length,
      warnings: this.entries.filter((e) => e.level === 'warn').length,
    };
  }

  clear() {
    this.entries = [];
  }
}

export const etlLogger = new ETLLogger();
