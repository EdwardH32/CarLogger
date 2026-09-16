const express = require("express");
const db = require("../db");
const { estimateModRecommendations } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  if (!car_id) return res.status(400).json({ error: "car_id is required" });
  const rows = db
    .prepare("SELECT * FROM mod_recommendations WHERE car_id = ? ORDER BY estimated_hp_gain DESC")
    .all(car_id);
  res.json(rows);
});

// Regenerate the full list of popular mods for this car, skipping ones already logged.
router.post("/:carId/generate", async (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.carId);
  if (!car) return res.status(404).json({ error: "Car not found" });

  const existingMods = db.prepare("SELECT name FROM mods WHERE car_id = ?").all(req.params.carId);

  try {
    const recommendations = await estimateModRecommendations({ car, existingMods });

    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM mod_recommendations WHERE car_id = ?").run(req.params.carId);
      const insert = db.prepare(
        `INSERT INTO mod_recommendations
         (car_id, name, category, estimated_cost, estimated_hp_gain, estimated_torque_gain, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const item of recommendations) {
        insert.run(
          req.params.carId,
          item.name,
          item.category,
          item.estimated_cost,
          item.estimated_hp_gain,
          item.estimated_torque_gain,
          item.description
        );
      }
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    const rows = db
      .prepare("SELECT * FROM mod_recommendations WHERE car_id = ? ORDER BY estimated_hp_gain DESC")
      .all(req.params.carId);
    res.json(rows);
  } catch (err) {
    console.error("AI mod recommendation estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI mod recommendations" });
  }
});

module.exports = router;
