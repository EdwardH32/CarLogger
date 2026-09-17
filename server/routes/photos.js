const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { upload, uploadDir } = require("../upload");

const router = express.Router();

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
