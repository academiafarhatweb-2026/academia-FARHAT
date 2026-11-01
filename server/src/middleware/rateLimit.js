import rateLimit from 'express-rate-limit';

// Brute-force protection for the login endpoints. Memory store is per serverless
// instance, so it's a speed bump rather than a hard global limit — still enough
// to stop someone hammering passwords or guessing student emails.
//
// Counted per account + IP, not per IP alone: requests arrive through the
// frontend's Vercel proxy, so many visitors can share one IP, and a per-IP
// limit would lock everyone out after a few people mistype their password.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    return `${email}|${req.ip}`;
  },
  message: { message: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' },
});
