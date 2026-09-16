const WIDTH = 680;
const HEIGHT = 320;
const PAD = { top: 16, right: 54, bottom: 34, left: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function buildPath(points, xScale, yScale, key) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.rpm).toFixed(1)} ${yScale(p[key]).toFixed(1)}`).join(" ");
}

export default function DynoChart({ points, redlineRpm }) {
  if (!points || points.length === 0) return null;

  const minRpm = points[0].rpm;
  const maxRpm = Math.max(redlineRpm || 0, points[points.length - 1].rpm);
  const maxHp = Math.max(...points.map((p) => p.hp)) * 1.15;
  const maxTorque = Math.max(...points.map((p) => p.torque)) * 1.15;

  const xScale = (rpm) => PAD.left + ((rpm - minRpm) / (maxRpm - minRpm)) * PLOT_W;
  const yScaleHp = (hp) => PAD.top + PLOT_H - (hp / maxHp) * PLOT_H;
  const yScaleTq = (tq) => PAD.top + PLOT_H - (tq / maxTorque) * PLOT_H;

  const hpPath = buildPath(points, xScale, yScaleHp, "hp");
  const tqPath = buildPath(points, xScale, yScaleTq, "torque");

  const peakHpPoint = points.reduce((a, b) => (b.hp > a.hp ? b : a));
  const peakTqPoint = points.reduce((a, b) => (b.torque > a.torque ? b : a));

  const gridLines = [0.25, 0.5, 0.75, 1];
  const rpmTicks = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Dyno chart of HP and torque vs RPM">
      {gridLines.map((f) => (
        <line
          key={f}
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + PLOT_H * (1 - f)}
          y2={PAD.top + PLOT_H * (1 - f)}
          stroke="#292524"
          strokeWidth="1"
        />
      ))}

      {rpmTicks.map((p) => (
        <text
          key={p.rpm}
          x={xScale(p.rpm)}
          y={HEIGHT - PAD.bottom + 18}
          textAnchor="middle"
          fontSize="10"
          fill="#78716c"
        >
          {(p.rpm / 1000).toFixed(1)}k
        </text>
      ))}
      <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize="10" fill="#57534e">
        RPM
      </text>

      <text x={12} y={PAD.top + 4} fontSize="10" fill="#34d399" textAnchor="start">
        HP
      </text>
      <text x={WIDTH - PAD.right + 8} y={PAD.top + 4} fontSize="10" fill="#60a5fa" textAnchor="start">
        TQ
      </text>

      <path d={hpPath} fill="none" stroke="#34d399" strokeWidth="2.5" />
      <path d={tqPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" />

      <circle cx={xScale(peakHpPoint.rpm)} cy={yScaleHp(peakHpPoint.hp)} r="3.5" fill="#34d399" />
      <text
        x={xScale(peakHpPoint.rpm)}
        y={yScaleHp(peakHpPoint.hp) - 8}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#34d399"
      >
        {peakHpPoint.hp.toFixed(0)} HP
      </text>

      <circle cx={xScale(peakTqPoint.rpm)} cy={yScaleTq(peakTqPoint.torque)} r="3.5" fill="#60a5fa" />
      <text
        x={xScale(peakTqPoint.rpm)}
        y={yScaleTq(peakTqPoint.torque) - 8}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#60a5fa"
      >
        {peakTqPoint.torque.toFixed(0)} lb-ft
      </text>

      {redlineRpm > 0 && redlineRpm <= maxRpm && (
        <>
          <line
            x1={xScale(redlineRpm)}
            x2={xScale(redlineRpm)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text x={xScale(redlineRpm)} y={PAD.top - 4} textAnchor="middle" fontSize="9" fill="#fb7185">
            redline
          </text>
        </>
      )}
    </svg>
  );
}
