/**
 * Logger Service
 * 
 * Production-ready logging system with environment-aware behavior
 * 
 * Features:
 * - Environment-based log levels (dev: all, prod: warn+error only)
 * - Structured log format with timestamp and context
 * - Type-safe log methods
 * - Automatic error stack trace capture
 * - Performance timing utilities
 * - Log filtering and grouping
 * 
 * @example
 * ```typescript
 * import { logger } from '@/services/loggerService';
 * 
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to save', new Error('Network error'));
 * logger.crud('CREATE', 'mdi_project_lists', { name: 'Project A' });
 * ```
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Log levels (ascending severity)
 */
export const LogLevel = {
  DEBUG: 0,   // Detailed debugging information
  INFO: 1,    // General informational messages
  WARN: 2,    // Warning messages
  ERROR: 3,   // Error messages
  NONE: 4     // Disable all logging
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxStoredLogs?: number;
}

/**
 * Performance timer result
 */
export interface PerformanceResult {
  duration: number;
  label: string;
  startTime: number;
  endTime: number;
}

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private performanceTimers: Map<string, number> = new Map();

  constructor() {
    // Default configuration based on environment
    this.config = {
      minLevel: this.getDefaultLogLevel(),
      enableConsole: true,
      enableRemote: false,
      maxStoredLogs: 1000
    };
  }

  /**
   * Get default log level based on environment
   */
  private getDefaultLogLevel(): LogLevel {
    const env = import.meta.env.MODE;
    
    // Production: Only warnings and errors
    if (env === 'production') {
      return LogLevel.WARN;
    }
    
    // Development: All logs
    return LogLevel.DEBUG;
  }

  /**
   * Configure logger settings
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // Core Logging Methods
  // ==========================================================================

  /**
   * Log debug message (development only)
   */
  public debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log informational message
   */
  public info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | unknown, context?: string): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log(LogLevel.ERROR, message, error, context, errorObj);
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string,
    error?: Error
  ): void {
    // Check if this log level should be processed
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error
    };

    // Store in buffer
    this.storeLog(entry);

    // Output to console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Send to remote logging service
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.logToRemote(entry);
    }
  }

  /**
   * Store log entry in buffer
   */
  private storeLog(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Limit buffer size
    if (this.logBuffer.length > (this.config.maxStoredLogs || 1000)) {
      this.logBuffer.shift();
    }
  }

  /**
   * Output log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = this.getLogPrefix(entry.level);
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString('ja-JP');

    let logMessage = `${prefix} ${timestamp} ${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data);
        if (entry.error) {
          console.error('Stack trace:', entry.error.stack);
        }
        break;
    }
  }

  /**
   * Send log to remote logging service
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote service:', error);
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return '💡';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  // ==========================================================================
  // Specialized Logging Methods
  // ==========================================================================

  /**
   * Log CRUD operations
   */
  public crud(
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'COUNT' | 'BATCH',
    tableName: string,
    data?: unknown
  ): void {
    const emoji = this.getCrudEmoji(operation);
    this.info(`${emoji} ${operation} operation on ${tableName}`, data, 'CRUD');
  }

  /**
   * Get emoji for CRUD operation
   */
  private getCrudEmoji(operation: string): string {
    switch (operation) {
      case 'CREATE': return '➕';
      case 'READ': return '📖';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'COUNT': return '🔢';
      case 'BATCH': return '📦';
      default: return '📝';
    }
  }

  /**
   * Log API requests
   */
  public api(method: string, url: string, status?: number, duration?: number): void {
    const statusEmoji = status ? (status < 400 ? '✅' : '❌') : '🔄';
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.info(`${statusEmoji} ${method} ${url}${durationStr}`, { status, duration }, 'API');
  }

  /**
   * Log user actions
   */
  public user(action: string, data?: unknown): void {
    this.info(`👤 ${action}`, data, 'USER');
  }

  /**
   * Log navigation events
   */
  public navigation(from: string, to: string): void {
    this.debug(`🧭 Navigation: ${from} → ${to}`, { from, to }, 'NAV');
  }

  // ==========================================================================
  // Performance Monitoring
  // ==========================================================================

  /**
   * Start performance timer
   */
  public startTimer(label: string): void {
    this.performanceTimers.set(label, performance.now());
    this.debug(`⏱️ Timer started: ${label}`, undefined, 'PERF');
  }

  /**
   * End performance timer and log result
   */
  public endTimer(label: string): PerformanceResult | null {
    const startTime = this.performanceTimers.get(label);
    if (!startTime) {
      this.warn(`Timer "${label}" was not started`, undefined, 'PERF');
      return null;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    this.performanceTimers.delete(label);
    
    const result: PerformanceResult = {
      duration,
      label,
      startTime,
      endTime
    };

    this.info(`⏱️ ${label}: ${duration}ms`, result, 'PERF');
    return result;
  }

  /**
   * Measure async function execution time
   */
  public async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(label);
    try {
      const result = await fn();
      const perf = this.endTimer(label);
      return { result, duration: perf?.duration || 0 };
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }

  // ==========================================================================
  // Log Management
  // ==========================================================================

  /**
   * Get all stored logs
   */
  public getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) {
      return [...this.logBuffer];
    }
    return this.logBuffer.filter(log => log.level === level);
  }

  /**
   * Get logs by context
   */
  public getLogsByContext(context: string): LogEntry[] {
    return this.logBuffer.filter(log => log.context === context);
  }

  /**
   * Clear all stored logs
   */
  public clearLogs(): void {
    this.logBuffer = [];
    this.info('Log buffer cleared', undefined, 'LOGGER');
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Get log statistics
   */
  public getStats(): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
  } {
    return {
      total: this.logBuffer.length,
      debug: this.logBuffer.filter(l => l.level === LogLevel.DEBUG).length,
      info: this.logBuffer.filter(l => l.level === LogLevel.INFO).length,
      warn: this.logBuffer.filter(l => l.level === LogLevel.WARN).length,
      error: this.logBuffer.filter(l => l.level === LogLevel.ERROR).length
    };
  }

  // ==========================================================================
  // Console Group Utilities
  // ==========================================================================

  /**
   * Start a collapsible console group
   */
  public group(label: string): void {
    if (this.config.enableConsole) {
      console.group(label);
    }
  }

  /**
   * Start a collapsed console group
   */
  public groupCollapsed(label: string): void {
    if (this.config.enableConsole) {
      console.groupCollapsed(label);
    }
  }

  /**
   * End console group
   */
  public groupEnd(): void {
    if (this.config.enableConsole) {
      console.groupEnd();
    }
  }

  /**
   * Log with auto-group (collapsed in production)
   */
  public grouped(label: string, fn: () => void): void {
    const isProd = import.meta.env.MODE === 'production';
    
    if (isProd) {
      this.groupCollapsed(label);
    } else {
      this.group(label);
    }
    
    fn();
    this.groupEnd();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton logger instance
 * Use this throughout the application
 */
export const logger = new Logger();

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Attach logger to window for debugging (development only)
 */
if (import.meta.env.MODE === 'development') {
  (window as any).__logger = logger;
}
