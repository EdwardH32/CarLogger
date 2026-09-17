const express = require("express");
const db = require("../db");

const router = express.Router();

// Public member directory, for the Discover page. Excludes the current user when logged in.
router.get("/", (req, res) => {
  const excludeId = req.user ? req.user.id : -1;
  const users = db
    .prepare(
      `SELECT id, username, display_name, avatar, avatar_photo, banner_photo, bio, location, created_at
       FROM users
       WHERE id != ?
       ORDER BY created_at DESC`
    )
    .all(excludeId);
  res.json(users);
});

module.exports = router;
