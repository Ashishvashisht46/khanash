import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={[
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      ].join(' ')}
    >
      {/* Icon container */}
      <motion.div
        variants={itemVariants}
        className="relative flex items-center justify-center"
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl scale-150 opacity-60" />
        <div className="relative p-5 rounded-full bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/20">
          <Icon className="w-8 h-8 text-gold/70" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 max-w-xs">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        )}
      </motion.div>

      {/* Action */}
      {action && (
        <motion.div variants={itemVariants}>{action}</motion.div>
      )}
    </motion.div>
  );
}
