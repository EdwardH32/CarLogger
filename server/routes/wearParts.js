const express = require("express");
const db = require("../db");
const { estimateWearParts } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  if (!car_id) return res.status(400).json({ error: "car_id is required" });
  const parts = db
    .prepare("SELECT * FROM wear_parts WHERE car_id = ? ORDER BY typical_mileage ASC")
    .all(car_id);
  res.json(parts);
});

// Regenerate the full list of known common wear/failure parts for a car.
router.post("/:carId/generate", async (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.carId);
  if (!car) return res.status(404).json({ error: "Car not found" });

  try {
    const parts = await estimateWearParts({ car });

    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM wear_parts WHERE car_id = ?").run(req.params.carId);
      const insert = db.prepare(
        "INSERT INTO wear_parts (car_id, part, typical_mileage, severity, symptoms, notes) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const item of parts) {
        insert.run(req.params.carId, item.part, item.typical_mileage, item.severity, item.symptoms, item.notes);
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    const rows = db
      .prepare("SELECT * FROM wear_parts WHERE car_id = ? ORDER BY typical_mileage ASC")
      .all(req.params.carId);
    res.json(rows);
  } catch (err) {
    console.error("Gemini wear parts estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI wear parts estimate" });
  }
});

module.exports = router;
