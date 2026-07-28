const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'El email y la contraseña son requeridos' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.active || !user.passwordHash) return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

// Students have no password: they only prove their email to get in.
async function studentLogin(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'El email es requerido' });

  const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'student' });
  if (!user || !user.active) return res.status(401).json({ message: 'No encontramos ese email' });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

async function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Sesión cerrada' });
}

async function me(req, res) {
  if (!req.user) return res.json({ user: null });
  const { _id, name, email, role, phone } = req.user;
  res.json({ user: { id: _id, name, email, role, phone } });
}

module.exports = { login, studentLogin, logout, me };
