const express = require("express");
const db = require("../db");
const { estimateMaintenanceIntervals } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  if (!car_id) return res.status(400).json({ error: "car_id is required" });
  const intervals = db
    .prepare("SELECT * FROM maintenance_intervals WHERE car_id = ? ORDER BY interval_miles ASC")
    .all(car_id);
  res.json(intervals);
});

// Regenerate the full recommended schedule for a car, replacing whatever was there before.
router.post("/:carId/generate", async (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.carId);
  if (!car) return res.status(404).json({ error: "Car not found" });

  try {
    const intervals = await estimateMaintenanceIntervals({ car });

    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM maintenance_intervals WHERE car_id = ?").run(req.params.carId);
      const insert = db.prepare(
        "INSERT INTO maintenance_intervals (car_id, part, interval_miles, interval_months, notes) VALUES (?, ?, ?, ?, ?)"
      );
      for (const item of intervals) {
        insert.run(req.params.carId, item.part, item.interval_miles, item.interval_months, item.notes);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    const rows = db
      .prepare("SELECT * FROM maintenance_intervals WHERE car_id = ? ORDER BY interval_miles ASC")
      .all(req.params.carId);
    res.json(rows);
  } catch (err) {
    console.error("Gemini maintenance interval estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI maintenance schedule" });
  }
});

module.exports = router;
