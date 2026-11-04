import { motion } from 'framer-motion';

interface Props {
  score: number; // 0..100
  color: string;
  size?: number;
}

/** Semicircle gauge. */
export default function RiskGauge({ score, color, size = 200 }: Props) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const pct = Math.min(100, Math.max(0, score)) / 100;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 24 }} role="img" aria-label={`Risk score ${score} out of 100`}>
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <path d={arc} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" className="text-slate-200 dark:text-cyber-700" />
        <motion.path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="font-mono text-4xl font-bold" style={{ color }}>
          {score}
        </motion.span>
        <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">/100</span>
      </div>
    </div>
  );
}