import { createClient } from '@supabase/supabase-js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  runId?: string;
  nodeType?: string;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

interface LoggerOptions {
  runId?: string;
  nodeType?: string;
  nodeId?: string;
  persistToDb?: boolean;
}

export class Logger {
  private runId?: string;
  private nodeType?: string;
  private nodeId?: string;
  private persistToDb: boolean;
  private logs: LogEntry[] = [];
  private supabase;

  constructor(options: LoggerOptions = {}) {
    this.runId = options.runId;
    this.nodeType = options.nodeType;
    this.nodeId = options.nodeId;
    this.persistToDb = options.persistToDb ?? false;

    if (this.persistToDb) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  private createEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      runId: this.runId,
      nodeType: this.nodeType,
      nodeId: this.nodeId,
      metadata,
    };
  }

  private async log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry = this.createEntry(level, message, metadata);
    this.logs.push(entry);

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    const context = this.nodeType ? ` [${this.nodeType}${this.nodeId ? `:${this.nodeId}` : ''}]` : '';
    const logMessage = `${prefix}${context} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, metadata || '');
        break;
      case 'info':
        console.info(logMessage, metadata || '');
        break;
      case 'warn':
        console.warn(logMessage, metadata || '');
        break;
      case 'error':
        console.error(logMessage, metadata || '');
        break;
    }

    // Persist errors to database if enabled
    if (this.persistToDb && this.runId && level === 'error' && this.supabase) {
      try {
        await this.supabase
          .from('runs')
          .update({
            error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.runId);
      } catch (e) {
        console.error('Failed to persist error to database:', e);
      }
    }
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    return this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    return this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    return this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    return this.log('error', message, metadata);
  }

  // Get all logs for this logger instance
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Create a child logger with additional context
  child(options: Partial<LoggerOptions>): Logger {
    return new Logger({
      runId: options.runId ?? this.runId,
      nodeType: options.nodeType ?? this.nodeType,
      nodeId: options.nodeId ?? this.nodeId,
      persistToDb: options.persistToDb ?? this.persistToDb,
    });
  }

  // Static method to create a run logger
  static forRun(runId: string, persistToDb = true): Logger {
    return new Logger({ runId, persistToDb });
  }

  // Static method to create a node logger
  static forNode(runId: string, nodeType: string, nodeId?: string): Logger {
    return new Logger({ runId, nodeType, nodeId, persistToDb: true });
  }
}

// Default logger for general use
export const logger = new Logger();
