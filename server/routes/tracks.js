const express = require("express");
const db = require("../db");
const { getCurrentOutput } = require("../carStats");
const { estimateTrackTime, cleanupEntryText } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  if (!car_id) return res.status(400).json({ error: "car_id is required" });
  const tracks = db
    .prepare("SELECT * FROM track_times WHERE car_id = ? ORDER BY created_at DESC")
    .all(car_id);
  res.json(tracks);
});

// Add a track and immediately get an AI-estimated lap time for the car's current output.
router.post("/", async (req, res) => {
  const { car_id, track_name } = req.body;
  if (!car_id || !track_name || !track_name.trim()) {
    return res.status(400).json({ error: "car_id and track_name are required" });
  }

  const output = getCurrentOutput(car_id);
  if (!output) return res.status(404).json({ error: "Car not found" });

  try {
    const cleaned = await cleanupEntryText({ track_name: track_name.trim() });

    const estimate = await estimateTrackTime({
      car: output.car,
      currentHp: output.currentHp,
      currentTorque: output.currentTorque,
      trackName: cleaned.track_name,
    });

    const stmt = db.prepare(
      "INSERT INTO track_times (car_id, track_name, lap_time, summary) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(car_id, cleaned.track_name, estimate.lap_time, estimate.summary);
    const track = db.prepare("SELECT * FROM track_times WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(track);
  } catch (err) {
    console.error("Gemini track time estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI track time estimate" });
  }
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM track_times WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Track time not found" });
  res.status(204).end();
});

module.exports = router;
