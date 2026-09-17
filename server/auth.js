const crypto = require("crypto");
const db = require("./db");

const SESSION_DAYS = 30;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const checkBuf = crypto.scryptSync(password, salt, 64);
  if (hashBuf.length !== checkBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, checkBuf);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

function getUserByToken(token) {
  if (!token) return null;
  const session = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return db
    .prepare("SELECT id, username, email, display_name, avatar, bio, created_at FROM users WHERE id = ?")
    .get(session.user_id);
}

// Attaches req.user (or null) for every request, without blocking unauthenticated ones.
function attachUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.token = token;
  req.user = getUserByToken(token);
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "You must be logged in" });
  next();
}

module.exports = { hashPassword, verifyPassword, createSession, getUserByToken, attachUser, requireAuth };
