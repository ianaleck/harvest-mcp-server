import winston from 'winston';
import { appConfig } from '../config/index';

// Create winston logger that writes to stderr (never stdout for MCP servers)
export function createLogger(module: string) {
  return winston.createLogger({
    level: appConfig.logging.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { module },
    transports: [
      // Always log to stderr in MCP servers (never stdout)
      new winston.transports.Console({
        stderrLevels: ['error', 'warn', 'info', 'debug'],
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
}