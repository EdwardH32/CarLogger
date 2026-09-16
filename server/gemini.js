const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL || `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(prompt, responseSchema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server. Add it to server/.env");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`AI service error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI response had no content");

  return JSON.parse(text);
}

// Fixes spelling, capitalization, and formatting on free-text fields the user typed (car
// make/model, mod name/description, maintenance service/description). Falls back to the raw
// input untouched if Gemini isn't configured or the call fails, so saving never breaks.
async function cleanupEntryText(fields) {
  const entries = Object.entries(fields).filter(([, v]) => typeof v === "string" && v.trim() !== "");
  if (entries.length === 0) return fields;

  const schema = {
    type: "OBJECT",
    properties: Object.fromEntries(
      entries.map(([key]) => [key, { type: "STRING", description: `Corrected text for "${key}"` }])
    ),
    required: entries.map(([key]) => key),
  };

  const prompt = `You are a copy editor for a car-modification logging app. Fix spelling mistakes,
correct capitalization, and clean up spacing/punctuation for each field below. Preserve the
original meaning, technical terms, brand names, and part numbers exactly — only fix genuine typos
and formatting issues. Keep each field about the same length; don't add information or reword
anything that's already correct. If a field is already correct, return it unchanged.

${entries.map(([key, value]) => `${key}: "${value}"`).join("\n")}`;

  try {
    const parsed = await callGemini(prompt, schema);
    const result = { ...fields };
    for (const [key] of entries) {
      if (typeof parsed[key] === "string" && parsed[key].trim()) {
        result[key] = parsed[key].trim();
      }
    }
    return result;
  } catch (err) {
    console.error("Gemini text cleanup failed, keeping raw input:", err.message);
    return fields;
  }
}

async function estimateModGains({ car, mod }) {
  const prompt = `You are an expert automotive tuner. Estimate the realistic horsepower and torque
gain for the following modification, based on typical dyno results for similar setups.

Vehicle: ${car.year} ${car.make} ${car.model}
Baseline: ${car.base_hp} HP / ${car.base_torque} lb-ft torque
Modification: ${mod.name}
Description: ${mod.description || "N/A"}

Give a realistic, conservative estimate. If the mod wouldn't meaningfully change power, gains can be 0.`;

  const schema = {
    type: "OBJECT",
    properties: {
      hp_gain: { type: "NUMBER", description: "Estimated HP gain, can be 0" },
      torque_gain: { type: "NUMBER", description: "Estimated lb-ft torque gain, can be 0" },
      summary: { type: "STRING", description: "One or two sentence explanation of the estimate" },
    },
    required: ["hp_gain", "torque_gain", "summary"],
  };

  const parsed = await callGemini(prompt, schema);

  return {
    hp_gain: Number(parsed.hp_gain) || 0,
    torque_gain: Number(parsed.torque_gain) || 0,
    summary: String(parsed.summary || "").slice(0, 1000),
  };
}

async function estimateModRecommendations({ car, existingMods }) {
  const existingNames = existingMods.map((m) => m.name).join(", ") || "none";

  const prompt = `You are an experienced automotive tuner who specializes in this exact make and
model. List the most common, popular modifications that real owners of this car install, ordered
from most to least popular/impactful.

Vehicle: ${car.year} ${car.make} ${car.model}
Baseline: ${car.base_hp} HP / ${car.base_torque} lb-ft torque
Mods already logged on this car — do not repeat these: ${existingNames}

For each mod give a realistic typical cost in US dollars, a realistic conservative HP and torque
gain estimate for THIS specific car, and a short one-sentence reason it's popular on this platform.

Spread the list across a full range of budgets, not just cheap bolt-ons — include some options in
each of these cost tiers where a realistic mod exists for this platform:
- Under $1,500 (e.g. intake, exhaust, tune, basic suspension)
- $1,500–$5,000 (e.g. coilovers, big brake kit, supporting mods)
- $5,000–$10,000 (e.g. built suspension/drivetrain parts, entry-level forced induction)
- Over $10,000 (e.g. a full forced-induction kit, built engine, or transmission upgrade), only if
  something like that realistically exists for this platform

Give 8 to 12 mods total, covering a mix of relevant categories such as intake, exhaust, tune/ECU,
suspension, brakes, forced induction, and drivetrain.`;

  const schema = {
    type: "OBJECT",
    properties: {
      mods: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Mod name, e.g. 'Cold air intake'" },
            category: {
              type: "STRING",
              description: "Category, e.g. Intake, Exhaust, Tune, Suspension, Brakes, Forced Induction, Drivetrain",
            },
            estimated_cost: { type: "NUMBER", description: "Typical cost in US dollars" },
            estimated_hp_gain: { type: "NUMBER", description: "Estimated HP gain, can be 0" },
            estimated_torque_gain: { type: "NUMBER", description: "Estimated lb-ft torque gain, can be 0" },
            description: { type: "STRING", description: "One sentence on why it's popular on this platform" },
          },
          required: ["name", "category", "estimated_cost", "estimated_hp_gain", "estimated_torque_gain", "description"],
        },
      },
    },
    required: ["mods"],
  };

  const parsed = await callGemini(prompt, schema);
  const mods = Array.isArray(parsed.mods) ? parsed.mods : [];

  return mods.slice(0, 12).map((item) => ({
    name: String(item.name || "").slice(0, 200),
    category: String(item.category || "").slice(0, 60),
    estimated_cost: Number(item.estimated_cost) || 0,
    estimated_hp_gain: Number(item.estimated_hp_gain) || 0,
    estimated_torque_gain: Number(item.estimated_torque_gain) || 0,
    description: String(item.description || "").slice(0, 500),
  }));
}

async function estimateStockSpecs({ year, make, model }) {
  const prompt = `You are an automotive database expert. Give the factory-stock horsepower and
torque for this vehicle as sold from the manufacturer (base/standard trim and engine unless the
model name implies a specific performance trim, e.g. "STI" or "Type R").

Vehicle: ${year} ${make} ${model}

If multiple engine options exist and none is specified, use the most common/base engine for that
model year. Be as accurate as you can from known factory specs.`;

  const schema = {
    type: "OBJECT",
    properties: {
      base_hp: { type: "NUMBER", description: "Factory-rated horsepower" },
      base_torque: { type: "NUMBER", description: "Factory-rated torque in lb-ft" },
      summary: { type: "STRING", description: "Brief note on trim/engine assumed, one sentence" },
    },
    required: ["base_hp", "base_torque", "summary"],
  };

  const parsed = await callGemini(prompt, schema);

  return {
    base_hp: Number(parsed.base_hp) || 0,
    base_torque: Number(parsed.base_torque) || 0,
    summary: String(parsed.summary || "").slice(0, 500),
  };
}

async function estimatePerformance({ car, currentHp, currentTorque }) {
  const prompt = `You are a professional automotive test driver and performance analyst. Estimate
realistic performance figures for this car IN ITS CURRENT STATE (including any modifications
already applied), not just the stock factory version.

Vehicle: ${car.year} ${car.make} ${car.model}
Factory-stock output: ${car.base_hp} HP / ${car.base_torque} lb-ft torque
Current output (with mods applied): ${currentHp} HP / ${currentTorque} lb-ft torque

Estimate:
- 0-60 mph time in seconds, adjusted for the current power level vs. stock (assume unchanged
  weight/drivetrain/tires unless the power delta implies otherwise).
- Top speed in mph, adjusted for the current power level (may be gearing/drag limited — use
  reasonable judgment for this vehicle type).
- A realistic Nürburgring Nordschleife lap time, formatted as "M:SS" (e.g. "7:47"), for a
  competent driver in this car's current state. If this exact car has no known Nordschleife
  record, estimate from comparable cars of similar performance and weight class.`;

  const schema = {
    type: "OBJECT",
    properties: {
      zero_to_60: { type: "NUMBER", description: "0-60 mph time in seconds" },
      top_speed: { type: "NUMBER", description: "Top speed in mph" },
      nordschleife_time: { type: "STRING", description: 'Nordschleife lap time formatted as "M:SS"' },
      summary: { type: "STRING", description: "One or two sentence explanation of the estimates" },
    },
    required: ["zero_to_60", "top_speed", "nordschleife_time", "summary"],
  };

  const parsed = await callGemini(prompt, schema);

  return {
    zero_to_60: Number(parsed.zero_to_60) || 0,
    top_speed: Number(parsed.top_speed) || 0,
    nordschleife_time: String(parsed.nordschleife_time || "").slice(0, 20),
    summary: String(parsed.summary || "").slice(0, 1000),
  };
}

async function estimateTrackTime({ car, currentHp, currentTorque, trackName }) {
  const prompt = `You are a professional automotive test driver and racing data analyst. Estimate a
realistic lap time for this car IN ITS CURRENT STATE (including any modifications already applied)
around the following real race track.

Vehicle: ${car.year} ${car.make} ${car.model}
Factory-stock output: ${car.base_hp} HP / ${car.base_torque} lb-ft torque
Current output (with mods applied): ${currentHp} HP / ${currentTorque} lb-ft torque
Track: ${trackName}

If "${trackName}" isn't a real, recognized race track or circuit, do your best to interpret it as
the closest real track with that name. Give a realistic lap time for a competent driver, estimated
from comparable cars of similar performance and weight class if no direct data exists for this
exact car.`;

  const schema = {
    type: "OBJECT",
    properties: {
      lap_time: { type: "STRING", description: 'Estimated lap time, formatted as "M:SS.ss" or "M:SS"' },
      summary: { type: "STRING", description: "One or two sentence explanation of the estimate" },
    },
    required: ["lap_time", "summary"],
  };

  const parsed = await callGemini(prompt, schema);

  return {
    lap_time: String(parsed.lap_time || "").slice(0, 20),
    summary: String(parsed.summary || "").slice(0, 1000),
  };
}

async function estimateMaintenanceIntervals({ car }) {
  const prompt = `You are a factory-trained automotive service advisor. Give the manufacturer-
recommended maintenance schedule for this vehicle — the standard list of parts/services and how
often each should be done, under normal (not severe) driving conditions.

Vehicle: ${car.year} ${car.make} ${car.model}
${car.mileage != null ? `Current mileage: ${car.mileage.toLocaleString()} mi` : ""}

Cover the common recurring items (e.g. oil & filter, tire rotation, cabin/engine air filter, brake
fluid, spark plugs, transmission fluid, coolant, timing belt/chain if applicable, brake pads). Give
each one a mileage interval and, where relevant, a time interval in months. Keep it to the 8-12
most important items.`;

  const schema = {
    type: "OBJECT",
    properties: {
      intervals: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            part: { type: "STRING", description: "Part or service name, e.g. 'Oil & filter change'" },
            interval_miles: { type: "NUMBER", description: "Recommended interval in miles" },
            interval_months: { type: "NUMBER", description: "Recommended interval in months, 0 if mileage-only" },
            notes: { type: "STRING", description: "Brief one-sentence note or caveat" },
          },
          required: ["part", "interval_miles", "interval_months", "notes"],
        },
      },
    },
    required: ["intervals"],
  };

  const parsed = await callGemini(prompt, schema);
  const intervals = Array.isArray(parsed.intervals) ? parsed.intervals : [];

  return intervals.slice(0, 20).map((item) => ({
    part: String(item.part || "").slice(0, 200),
    interval_miles: Number(item.interval_miles) || 0,
    interval_months: Number(item.interval_months) || 0,
    notes: String(item.notes || "").slice(0, 500),
  }));
}

async function estimateWearParts({ car }) {
  const prompt = `You are a master mechanic who specializes in this specific make and model. List the
parts that are KNOWN, COMMON failure or wear points for this exact vehicle — not routine
maintenance items (skip oil, filters, tires, fluids), but the specific components that owners of
this car commonly end up having to replace, based on real-world reliability history for this
generation/model.

Vehicle: ${car.year} ${car.make} ${car.model}
${car.mileage != null ? `Current mileage: ${car.mileage.toLocaleString()} mi` : ""}

Examples of the kind of thing to include (only if actually true for this vehicle): plastic coolant
system components, water pumps, ignition coils, suspension bushings/links, window regulators,
gaskets/seals known to leak, electronic modules, carbon buildup on direct-injection intake valves,
clutch/dual-mass flywheel, etc. If this car has no notably common failure points beyond normal wear,
say so with fewer items rather than inventing generic ones. Give each a typical mileage at which
problems tend to start appearing.`;

  const schema = {
    type: "OBJECT",
    properties: {
      parts: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            part: { type: "STRING", description: "Component name" },
            typical_mileage: { type: "NUMBER", description: "Typical mileage when issues tend to start" },
            severity: { type: "STRING", description: "One of: Low, Medium, High" },
            symptoms: { type: "STRING", description: "Short description of symptoms when it fails" },
            notes: { type: "STRING", description: "Brief note, e.g. why it's a known weak point" },
          },
          required: ["part", "typical_mileage", "severity", "symptoms", "notes"],
        },
      },
    },
    required: ["parts"],
  };

  const parsed = await callGemini(prompt, schema);
  const parts = Array.isArray(parsed.parts) ? parsed.parts : [];

  return parts.slice(0, 20).map((item) => ({
    part: String(item.part || "").slice(0, 200),
    typical_mileage: Number(item.typical_mileage) || 0,
    severity: String(item.severity || "Medium").slice(0, 20),
    symptoms: String(item.symptoms || "").slice(0, 500),
    notes: String(item.notes || "").slice(0, 500),
  }));
}

// Gets the REAL factory dyno curve shape for this exact engine (grounded in known/published dyno
// data, not an invented generic shape). The caller scales this to the car's current mod state —
// keeping the curve's actual character (where it plateaus, dips, peaks) tied to the real engine,
// while the magnitude reflects whatever mods are logged.
async function estimateStockDynoCurve({ car }) {
  const prompt = `You are an automotive powertrain data analyst with access to real, published dyno
results for production engines. Reconstruct the FACTORY-STOCK dyno curve for this exact engine —
grounded in actual known dyno data and the real characteristics of this specific engine/generation,
not a generic or idealized curve shape.

Vehicle: ${car.year} ${car.make} ${car.model}
Factory rating: ${car.base_hp} HP / ${car.base_torque} lb-ft torque

Reflect this engine's REAL behavior as accurately as you can recall — e.g. exactly where a turbo
engine's torque plateau starts and ends, where it tapers as boost/VE falls off, or where a
naturally-aspirated engine's torque peaks and how sharply HP rises to redline. The curve's peak
values should land close to the factory rating above (peak crank HP ≈ ${car.base_hp}, peak crank
torque ≈ ${car.base_torque} lb-ft).

Give the exact redline RPM for this engine. Then provide ONE data point every 500 RPM, starting at
1000 RPM and continuing up through the redline RPM, PLUS one final point 500 RPM past redline
(showing the natural power drop-off just past redline). For example, if redline is 6700 RPM:
1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 6700, 7200.`;

  const schema = {
    type: "OBJECT",
    properties: {
      redline_rpm: { type: "NUMBER", description: "Exact redline RPM for this engine" },
      points: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            rpm: { type: "NUMBER" },
            hp: { type: "NUMBER", description: "Crank HP at this RPM, stock" },
            torque: { type: "NUMBER", description: "Crank torque (lb-ft) at this RPM, stock" },
          },
          required: ["rpm", "hp", "torque"],
        },
      },
      summary: { type: "STRING", description: "One or two sentence note on this engine's real curve character" },
    },
    required: ["redline_rpm", "points", "summary"],
  };

  const parsed = await callGemini(prompt, schema);
  const points = Array.isArray(parsed.points) ? parsed.points : [];

  return {
    redline_rpm: Number(parsed.redline_rpm) || 0,
    points: points
      .map((p) => ({
        rpm: Number(p.rpm) || 0,
        hp: Number(p.hp) || 0,
        torque: Number(p.torque) || 0,
      }))
      .filter((p) => p.rpm > 0)
      .sort((a, b) => a.rpm - b.rpm),
    summary: String(parsed.summary || "").slice(0, 1000),
  };
}

// Scales a real stock dyno curve to the car's current (modded) output. Scaling proportionally
// keeps the curve's real shape intact — where it plateaus, dips, peaks — while the magnitude
// reflects the current mod state instead of asking the model to invent modded numbers directly.
function scaleDynoCurve(stockCurve, car, currentHp, currentTorque) {
  const hpScale = car.base_hp > 0 ? currentHp / car.base_hp : 1;
  const torqueScale = car.base_torque > 0 ? currentTorque / car.base_torque : 1;

  const points = stockCurve.points.map((p) => ({
    rpm: p.rpm,
    hp: Math.round(p.hp * hpScale * 10) / 10,
    torque: Math.round(p.torque * torqueScale * 10) / 10,
  }));

  return { redline_rpm: stockCurve.redline_rpm, points, summary: stockCurve.summary.slice(0, 1200) };
}

module.exports = {
  cleanupEntryText,
  estimateModGains,
  estimateModRecommendations,
  estimateStockSpecs,
  estimatePerformance,
  estimateTrackTime,
  estimateMaintenanceIntervals,
  estimateWearParts,
  estimateStockDynoCurve,
  scaleDynoCurve,
};
