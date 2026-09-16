const express = require("express");
const db = require("../db");
const { getCurrentOutput } = require("../carStats");
const { estimatePerformance } = require("../gemini");

const router = express.Router();

router.get("/:carId", (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.carId);
  if (!car) return res.status(404).json({ error: "Car not found" });

  const perf = db.prepare("SELECT * FROM performance WHERE car_id = ?").get(req.params.carId);
  res.json(perf || null);
});

router.post("/:carId/estimate", async (req, res) => {
  const output = getCurrentOutput(req.params.carId);
  if (!output) return res.status(404).json({ error: "Car not found" });

  try {
    const estimate = await estimatePerformance({
      car: output.car,
      currentHp: output.currentHp,
      currentTorque: output.currentTorque,
    });

    db.prepare(
      `INSERT INTO performance (car_id, zero_to_60, top_speed, nordschleife_time, summary, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(car_id) DO UPDATE SET
         zero_to_60 = excluded.zero_to_60,
         top_speed = excluded.top_speed,
         nordschleife_time = excluded.nordschleife_time,
         summary = excluded.summary,
         updated_at = excluded.updated_at`
    ).run(req.params.carId, estimate.zero_to_60, estimate.top_speed, estimate.nordschleife_time, estimate.summary);

    const perf = db.prepare("SELECT * FROM performance WHERE car_id = ?").get(req.params.carId);
    res.json(perf);
  } catch (err) {
    console.error("Gemini performance estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI performance estimate" });
  }
});

module.exports = router;
