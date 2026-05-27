const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db     = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();

    await db.query(
      'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      [id, name, email, hash]
    );

    const user  = { id, name, email };
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const dbUser = rows[0];
    const match  = await bcrypt.compare(password, dbUser.password);
    if (!match) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    const user  = { id: dbUser.id, name: dbUser.name, email: dbUser.email, avatar_url: dbUser.avatar_url };
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

// GET me
const me = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT me
const updateMe = async (req, res, next) => {
    try {
        const { name, avatar_url, currentPassword, newPassword } = req.body;
 
        // If user wants to change password, verify the current one first
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new one' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }
 
            const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
            if (!rows.length) return res.status(404).json({ error: 'User not found' });
 
            const match = await bcrypt.compare(currentPassword, rows[0].password);
            if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
 
            const hash = await bcrypt.hash(newPassword, 12);
            await db.query(
                'UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), password = ? WHERE id = ?',
                [name || null, avatar_url || null, hash, req.user.id]
            );
        } else {
            await db.query(
                'UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
                [name || null, avatar_url || null, req.user.id]
            );
        }
 
        // Return updated user
        const [updated] = await db.query(
            'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        return res.json(updated[0]);
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, me, updateMe };