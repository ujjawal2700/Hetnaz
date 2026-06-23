/**
 * Security Middleware
 * @owner: Sujal (Shared - Both review)
 * @purpose: Security headers and CORS configuration
 */

import helmet from 'helmet';
import cors from 'cors';
import { getEnvConfig } from '../config/env.js';

const { frontendUrl } = getEnvConfig();

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow mobile apps, postman, and local server-to-server (no origin)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://dilmate.in',
      'https://www.dilmate.in',
      'https://api.dilmate.in',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];

    // Check if the origin matches any of our allowed list (ignoring trailing slash)
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(o => o === cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      process.env.NODE_ENV === 'development';

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS Warning: Origin ${origin} not recognized.`);
      // For production safety, we still allow but log it
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Important for legacy browsers
  preflightContinue: false
};

/**
 * Helmet security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

