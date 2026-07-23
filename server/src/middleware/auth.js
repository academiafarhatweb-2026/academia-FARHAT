const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No autenticado' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ message: 'No autenticado' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'No autenticado' });
  }
}

// For routes like /auth/me where "no session" is a normal, valid answer —
// not an error — so it should never respond 401. Just leaves req.user unset.
async function attachUserIfPresent(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (token) {
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (user && user.active) req.user = user;
    }
  } catch {
    // invalid/expired token — treat the same as no session
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, attachUserIfPresent };
