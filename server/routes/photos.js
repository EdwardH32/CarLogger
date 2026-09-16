const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../db");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "data", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname) || "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", (req, res) => {
  const { car_id } = req.query;
  if (!car_id) return res.status(400).json({ error: "car_id is required" });
  const photos = db
    .prepare("SELECT * FROM car_photos WHERE car_id = ? ORDER BY created_at DESC")
    .all(car_id);
  res.json(photos);
});

router.post("/", (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { car_id, caption } = req.body;
    if (!car_id) return res.status(400).json({ error: "car_id is required" });
    if (!req.file) return res.status(400).json({ error: "photo file is required" });

    const car = db.prepare("SELECT id FROM cars WHERE id = ?").get(car_id);
    if (!car) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Car not found" });
    }

    const stmt = db.prepare("INSERT INTO car_photos (car_id, filename, caption) VALUES (?, ?, ?)");
    const info = stmt.run(car_id, req.file.filename, (caption || "").trim() || null);
    const photo = db.prepare("SELECT * FROM car_photos WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(photo);
  });
});

router.delete("/:id", (req, res) => {
  const photo = db.prepare("SELECT * FROM car_photos WHERE id = ?").get(req.params.id);
  if (!photo) return res.status(404).json({ error: "Photo not found" });

  db.prepare("DELETE FROM car_photos WHERE id = ?").run(req.params.id);
  fs.unlink(path.join(uploadDir, photo.filename), () => {});
  res.status(204).end();
});

module.exports = router;
