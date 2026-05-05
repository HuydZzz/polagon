"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Animated hexagonal Polagon Score badge. Number counts up via spring;
 * the inner hex pulses subtly when the score is non-zero.
 */
export function HexBadge({
  score,
  accuracyPct = 0,
  size = 144,
}: {
  score: number;
  accuracyPct?: number;
  size?: number;
}) {
  const motionScore = useMotionValue(0);
  const spring = useSpring(motionScore, { stiffness: 90, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    motionScore.set(score);
  }, [score, motionScore]);

  const w = size;
  const h = size * 1.1;
  const ringR = (w - 18) / 2;
  const ringC = 2 * Math.PI * ringR;
  const accLen = (Math.max(0, Math.min(100, accuracyPct)) / 100) * ringC;

  return (
    <div className="relative" style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="hex-grad-out" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="hex-grad-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.18)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.06)" />
          </linearGradient>
        </defs>

        {/* outer hex */}
        <polygon
          points={hexPoints(w / 2, h / 2, w / 2 - 3)}
          fill="none"
          stroke="url(#hex-grad-out)"
          strokeWidth="2"
        />
        {/* inner hex with subtle pulse */}
        <motion.polygon
          points={hexPoints(w / 2, h / 2, w / 2 - 18)}
          fill="url(#hex-grad-fill)"
          animate={{ opacity: score > 0 ? [0.7, 1, 0.7] : 0.4 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* accuracy ring */}
        {accuracyPct > 0 && (
          <motion.circle
            cx={w / 2}
            cy={h / 2}
            r={ringR}
            fill="none"
            stroke="rgb(34 197 94)"
            strokeOpacity="0.85"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={ringC}
            initial={{ strokeDashoffset: ringC }}
            animate={{ strokeDashoffset: ringC - accLen }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            transform={`rotate(-90 ${w / 2} ${h / 2})`}
          />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="font-display text-4xl tabular-nums leading-none text-text">
          {display}
        </motion.span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-text-dim">
          score
        </span>
      </div>
    </div>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  // pointy-top hex
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}
