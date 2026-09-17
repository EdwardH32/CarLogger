const express = require("express");
const db = require("../db");
const { hashPassword, verifyPassword, createSession, requireAuth } = require("../auth");
const { cleanupEntryText } = require("../gemini");

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    display_name: u.display_name,
    avatar: u.avatar,
    bio: u.bio,
    created_at: u.created_at,
  };
}

router.post("/register", async (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, underscore" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(cleanUsername);
  if (existing) return res.status(409).json({ error: "That username is already taken" });

  const cleaned = await cleanupEntryText({ display_name: (display_name || username).trim() });

  const stmt = db.prepare(
    "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(
    cleanUsername,
    email ? email.trim().toLowerCase() : null,
    hashPassword(password),
    cleaned.display_name
  );

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }

  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

router.post("/logout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(req.token);
  res.status(204).end();
});

router.get("/me", (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put("/me", requireAuth, async (req, res) => {
  const { display_name, avatar, bio } = req.body;
  const cleaned = await cleanupEntryText({
    display_name: display_name != null ? String(display_name).trim() : undefined,
    bio: bio != null ? String(bio).trim() : undefined,
  });

  db.prepare("UPDATE users SET display_name = ?, avatar = ?, bio = ? WHERE id = ?").run(
    display_name != null ? cleaned.display_name : req.user.display_name,
    avatar !== undefined ? avatar : req.user.avatar,
    bio != null ? cleaned.bio : req.user.bio,
    req.user.id
  );

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
