const db = require("./db");

// Current HP/torque = factory baseline + all AI-estimated mod gains logged so far.
function getCurrentOutput(carId) {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(carId);
  if (!car) return null;

  const gains = db
    .prepare(
      `SELECT COALESCE(SUM(estimated_hp_gain), 0) AS hp_gain,
              COALESCE(SUM(estimated_torque_gain), 0) AS torque_gain
       FROM mods WHERE car_id = ?`
    )
    .get(carId);

  return {
    car,
    currentHp: car.base_hp + gains.hp_gain,
    currentTorque: car.base_torque + gains.torque_gain,
  };
}

module.exports = { getCurrentOutput };
