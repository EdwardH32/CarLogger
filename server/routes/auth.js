const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { hashPassword, verifyPassword, createSession, requireAuth } = require("../auth");
const { cleanupEntryText } = require("../gemini");
const { upload, uploadDir } = require("../upload");

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    display_name: u.display_name,
    avatar: u.avatar,
    avatar_photo: u.avatar_photo,
    banner_photo: u.banner_photo,
    bio: u.bio,
    location: u.location,
    created_at: u.created_at,
  };
}

function deletePhotoFile(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, filename), () => {});
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, underscore" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  const existingUsername = db.prepare("SELECT id FROM users WHERE username = ?").get(cleanUsername);
  if (existingUsername) return res.status(409).json({ error: "That username is already taken" });

  const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
  if (existingEmail) return res.status(409).json({ error: "That email is already registered" });

  const cleaned = await cleanupEntryText({ display_name: (display_name || username).trim() });

  const stmt = db.prepare(
    "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(cleanUsername, cleanEmail, hashPassword(password), cleaned.display_name);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username (or email) and password are required" });
  }

  const identifier = username.trim().toLowerCase();
  const user = db
    .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
    .get(identifier, identifier);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect username, email, or password" });
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
  const { display_name, avatar, bio, location } = req.body;
  const cleaned = await cleanupEntryText({
    display_name: display_name != null ? String(display_name).trim() : undefined,
    bio: bio != null ? String(bio).trim() : undefined,
    location: location != null ? String(location).trim() : undefined,
  });

  db.prepare("UPDATE users SET display_name = ?, avatar = ?, bio = ?, location = ? WHERE id = ?").run(
    display_name != null ? cleaned.display_name : req.user.display_name,
    avatar !== undefined ? avatar : req.user.avatar,
    bio != null ? cleaned.bio : req.user.bio,
    location != null ? cleaned.location || null : req.user.location,
    req.user.id
  );

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.post("/me/avatar", requireAuth, (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "photo file is required" });

    deletePhotoFile(req.user.avatar_photo);
    db.prepare("UPDATE users SET avatar_photo = ? WHERE id = ?").run(req.file.filename, req.user.id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json({ user: publicUser(user) });
  });
});

router.delete("/me/avatar", requireAuth, (req, res) => {
  deletePhotoFile(req.user.avatar_photo);
  db.prepare("UPDATE users SET avatar_photo = NULL WHERE id = ?").run(req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.post("/me/banner", requireAuth, (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "photo file is required" });

    deletePhotoFile(req.user.banner_photo);
    db.prepare("UPDATE users SET banner_photo = ? WHERE id = ?").run(req.file.filename, req.user.id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json({ user: publicUser(user) });
  });
});

router.delete("/me/banner", requireAuth, (req, res) => {
  deletePhotoFile(req.user.banner_photo);
  db.prepare("UPDATE users SET banner_photo = NULL WHERE id = ?").run(req.user.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
