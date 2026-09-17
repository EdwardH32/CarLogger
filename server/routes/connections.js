const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const connections = db
    .prepare(
      `SELECT users.id, users.username, users.display_name, users.avatar, users.avatar_photo, users.bio,
              connections.created_at AS connected_at
       FROM connections
       JOIN users ON users.id = connections.target_user_id
       WHERE connections.user_id = ?
       ORDER BY connections.created_at DESC`
    )
    .all(req.user.id);
  res.json(connections);
});

router.post("/", requireAuth, (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });
  if (Number(user_id) === req.user.id) {
    return res.status(400).json({ error: "You can't connect with yourself" });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(user_id);
  if (!target) return res.status(404).json({ error: "User not found" });

  db.prepare("INSERT OR IGNORE INTO connections (user_id, target_user_id) VALUES (?, ?)").run(
    req.user.id,
    user_id
  );
  res.status(201).json({ user_id: Number(user_id) });
});

router.delete("/:userId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM connections WHERE user_id = ? AND target_user_id = ?").run(
    req.user.id,
    req.params.userId
  );
  res.status(204).end();
});

module.exports = router;
