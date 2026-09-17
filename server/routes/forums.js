const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");
const { cleanupEntryText } = require("../gemini");

const router = express.Router();

const THREAD_SELECT = `
  SELECT t.id, t.title, t.body, t.created_at, u.id AS user_id, u.username, u.display_name, u.avatar
  FROM forum_threads t
  JOIN users u ON u.id = t.user_id
`;

const REPLY_SELECT = `
  SELECT r.id, r.thread_id, r.body, r.created_at, u.id AS user_id, u.username, u.display_name, u.avatar
  FROM forum_replies r
  JOIN users u ON u.id = r.user_id
`;

router.get("/threads", (req, res) => {
  const threads = db
    .prepare(
      `SELECT t.id, t.title, t.created_at, u.username, u.display_name, u.avatar,
         (SELECT COUNT(*) FROM forum_replies r WHERE r.thread_id = t.id) AS reply_count,
         COALESCE(
           (SELECT MAX(r2.created_at) FROM forum_replies r2 WHERE r2.thread_id = t.id),
           t.created_at
         ) AS last_activity
       FROM forum_threads t
       JOIN users u ON u.id = t.user_id
       ORDER BY last_activity DESC`
    )
    .all();
  res.json(threads);
});

router.post("/threads", requireAuth, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !title.trim() || !body || !body.trim()) {
    return res.status(400).json({ error: "title and body are required" });
  }

  const cleaned = await cleanupEntryText({ title: title.trim(), body: body.trim() });

  const stmt = db.prepare("INSERT INTO forum_threads (user_id, title, body) VALUES (?, ?, ?)");
  const info = stmt.run(req.user.id, cleaned.title, cleaned.body);
  const thread = db.prepare(`${THREAD_SELECT} WHERE t.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(thread);
});

router.get("/threads/:id", (req, res) => {
  const thread = db.prepare(`${THREAD_SELECT} WHERE t.id = ?`).get(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const replies = db
    .prepare(`${REPLY_SELECT} WHERE r.thread_id = ? ORDER BY r.created_at ASC`)
    .all(req.params.id);

  res.json({ thread, replies });
});

router.delete("/threads/:id", requireAuth, (req, res) => {
  const thread = db.prepare("SELECT * FROM forum_threads WHERE id = ?").get(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.user_id !== req.user.id) return res.status(403).json({ error: "You can only delete your own threads" });

  db.prepare("DELETE FROM forum_threads WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

router.post("/threads/:id/replies", requireAuth, async (req, res) => {
  const thread = db.prepare("SELECT id FROM forum_threads WHERE id = ?").get(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "body is required" });

  const cleaned = await cleanupEntryText({ body: body.trim() });

  const stmt = db.prepare("INSERT INTO forum_replies (thread_id, user_id, body) VALUES (?, ?, ?)");
  const info = stmt.run(req.params.id, req.user.id, cleaned.body);
  const reply = db.prepare(`${REPLY_SELECT} WHERE r.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(reply);
});

router.delete("/replies/:id", requireAuth, (req, res) => {
  const reply = db.prepare("SELECT * FROM forum_replies WHERE id = ?").get(req.params.id);
  if (!reply) return res.status(404).json({ error: "Reply not found" });
  if (reply.user_id !== req.user.id) return res.status(403).json({ error: "You can only delete your own replies" });

  db.prepare("DELETE FROM forum_replies WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

module.exports = router;
