import React from 'react';
import { motion } from 'framer-motion';

// ─── Shimmer keyframe via Framer Motion ──────────────────────────────────────
const shimmerVariants = {
  initial: { backgroundPosition: '-500px 0' },
  animate: {
    backgroundPosition: '500px 0',
    transition: {
      repeat: Infinity,
      duration: 1.6,
      ease: 'linear',
    },
  },
};

function ShimmerBase({ className = '' }) {
  return (
    <motion.div
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      className={[
        'rounded',
        className,
      ].join(' ')}
      style={{
        background:
          'linear-gradient(90deg, rgba(201,168,76,0.04) 0%, rgba(201,168,76,0.12) 40%, rgba(201,168,76,0.04) 100%)',
        backgroundSize: '1000px 100%',
      }}
    />
  );
}

// ─── Variant renderers ───────────────────────────────────────────────────────

function TextSkeleton({ count = 3, className = '' }) {
  return (
    <div className={['flex flex-col gap-2.5', className].join(' ')}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBase
          key={i}
          className={[
            'h-4',
            i === count - 1 && count > 1 ? 'w-3/4' : 'w-full',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

function CardSkeleton({ count = 1, className = '' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-2xl border border-gold/10 bg-white/[0.03] p-5',
            'flex flex-col gap-4',
            className,
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <ShimmerBase className="h-4 w-1/3" />
            <ShimmerBase className="h-8 w-8 rounded-lg" />
          </div>
          <ShimmerBase className="h-8 w-2/5" />
          <ShimmerBase className="h-3 w-3/5" />
        </div>
      ))}
    </>
  );
}

function TableSkeleton({ count = 5, className = '' }) {
  return (
    <div className={['flex flex-col gap-0 rounded-xl overflow-hidden border border-gold/10', className].join(' ')}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[#0d1b2a]">
        {[40, 25, 20, 15].map((w, i) => (
          <ShimmerBase key={i} className="h-3" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            'flex gap-4 px-4 py-3.5 border-t border-gold/5',
            i % 2 === 1 ? 'bg-white/[0.015]' : '',
          ].join(' ')}
        >
          {[40, 25, 20, 15].map((w, j) => (
            <ShimmerBase key={j} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function AvatarSkeleton({ count = 1, className = '' }) {
  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <ShimmerBase className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <ShimmerBase className="h-3.5 w-32" />
            <ShimmerBase className="h-3 w-24" />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Skeleton component ──────────────────────────────────────────────────

export default function Skeleton({
  variant = 'text',
  count = 1,
  className = '',
}) {
  switch (variant) {
    case 'card':
      return <CardSkeleton count={count} className={className} />;
    case 'table':
      return <TableSkeleton count={count} className={className} />;
    case 'avatar':
      return <AvatarSkeleton count={count} className={className} />;
    case 'text':
    default:
      return <TextSkeleton count={count} className={className} />;
  }
}

export { ShimmerBase };
