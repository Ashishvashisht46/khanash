import React from 'react';
import { motion } from 'framer-motion';

const variantBase = {
  default:
    'surface-card',
  glass:
    'surface-card-soft',
  stat:
    'surface-card overflow-hidden',
};

const hoverVariants = {
  rest: { y: 0, boxShadow: '0 0 0 rgba(85,195,255,0)' },
  hover: {
    y: -3,
    boxShadow: '0 18px 42px rgba(30,167,255,0.12)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

const glassHoverVariants = {
  rest: { y: 0, boxShadow: '0 0 0 rgba(85,195,255,0)', borderColor: 'rgba(255,255,255,0.08)' },
  hover: {
    y: -4,
    boxShadow: '0 20px 60px rgba(30,167,255,0.14)',
    borderColor: 'rgba(90,182,255,0.24)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

// Accent bar colors for stat variant - cycles through these
const accentColors = [
  'from-brand to-accent',
  'from-blue-400 to-blue-500',
  'from-emerald-400 to-emerald-500',
  'from-purple-400 to-purple-500',
];

export default function Card({
  variant = 'default',
  hover = false,
  accentColor,
  className = '',
  children,
  ...rest
}) {
  const motionVariants =
    variant === 'glass' || variant === 'stat' ? glassHoverVariants : hoverVariants;

  return (
    <motion.div
      initial="rest"
      whileHover={hover ? 'hover' : 'rest'}
      variants={motionVariants}
      className={[
        'relative rounded-2xl transition-colors duration-300',
        variantBase[variant] ?? variantBase.default,
        className,
      ].join(' ')}
      {...rest}
    >
      {variant === 'stat' && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accentColor || accentColors[0]} rounded-l-2xl`}
        />
      )}
      {children}
    </motion.div>
  );
}
