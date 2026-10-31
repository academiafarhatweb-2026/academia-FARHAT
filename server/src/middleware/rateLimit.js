import rateLimit from 'express-rate-limit';

// Brute-force protection for the login endpoints. Memory store is per serverless
// instance, so it's a speed bump rather than a hard global limit — still enough
// to stop someone hammering passwords or guessing student emails.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' },
});
