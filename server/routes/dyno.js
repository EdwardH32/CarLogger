const express = require("express");
const db = require("../db");
const { getCurrentOutput } = require("../carStats");
const { estimateStockDynoCurve, scaleDynoCurve } = require("../gemini");

const router = express.Router();

router.get("/:carId", (req, res) => {
  const row = db.prepare("SELECT * FROM dyno_curves WHERE car_id = ?").get(req.params.carId);
  if (!row) return res.json(null);
  res.json({ ...row, points: JSON.parse(row.points) });
});

router.post("/:carId/estimate", async (req, res) => {
  const output = getCurrentOutput(req.params.carId);
  if (!output) return res.status(404).json({ error: "Car not found" });

  try {
    const stockCurve = await estimateStockDynoCurve({ car: output.car });
    const curve = scaleDynoCurve(stockCurve, output.car, output.currentHp, output.currentTorque);

    db.prepare(
      `INSERT INTO dyno_curves (car_id, redline_rpm, points, summary, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(car_id) DO UPDATE SET
         redline_rpm = excluded.redline_rpm,
         points = excluded.points,
         summary = excluded.summary,
         updated_at = excluded.updated_at`
    ).run(req.params.carId, curve.redline_rpm, JSON.stringify(curve.points), curve.summary);

    const row = db.prepare("SELECT * FROM dyno_curves WHERE car_id = ?").get(req.params.carId);
    res.json({ ...row, points: JSON.parse(row.points) });
  } catch (err) {
    console.error("Gemini dyno curve estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI dyno estimate" });
  }
});

module.exports = router;
