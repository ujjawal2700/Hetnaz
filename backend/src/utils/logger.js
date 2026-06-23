/**
 * Winston Logger Configuration
 * @owner: Sujal (Shared - Both review)
 * @purpose: Centralized logging utility
 */

import winston from 'winston';
import { getEnvConfig } from '../config/env.js';

const { nodeEnv, logLevel } = getEnvConfig();

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0 && meta.service !== 'dil_mate-backend') {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports array (SINGLE console transport to avoid duplicates)
const transports = [
  // Write all logs with level 'error' and below to error.log
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Write all logs to combined.log
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add SINGLE console transport (dev = pretty, prod = JSON)
transports.push(
  new winston.transports.Console({
    format: nodeEnv === 'production' ? logFormat : consoleFormat,
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'dil_mate-backend' },
  transports,
});

export default logger;
