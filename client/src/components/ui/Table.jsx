import React from 'react';
import { motion } from 'framer-motion';

// ─── Root Table ──────────────────────────────────────────────────────────────
function Table({ className = '', stickyHeader = false, children, ...rest }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gold/10">
      <table
        className={['w-full border-collapse text-sm', className].join(' ')}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ className = '', sticky = false, children, ...rest }) {
  return (
    <thead
      className={[
        'bg-[#0d1b2a]',
        sticky ? 'sticky top-0 z-10' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </thead>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────
function Body({ className = '', children, ...rest }) {
  return (
    <tbody
      className={['divide-y divide-gold/5', className].join(' ')}
      {...rest}
    >
      {children}
    </tbody>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ className = '', hover = true, even = false, children, ...rest }) {
  return (
    <motion.tr
      initial={false}
      whileHover={
        hover
          ? {
              backgroundColor: 'rgba(201,168,76,0.04)',
              borderLeftColor: 'rgba(201,168,76,0.6)',
            }
          : {}
      }
      transition={{ duration: 0.15 }}
      className={[
        'relative transition-colors duration-150',
        even ? 'bg-white/[0.015]' : 'bg-transparent',
        hover ? 'cursor-default border-l-2 border-l-transparent' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.tr>
  );
}

// ─── Head Cell ───────────────────────────────────────────────────────────────
function Head({ className = '', children, ...rest }) {
  return (
    <th
      className={[
        'px-4 py-3 text-left text-xs font-semibold text-gold/80 uppercase tracking-widest',
        'whitespace-nowrap select-none',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </th>
  );
}

// ─── Cell ─────────────────────────────────────────────────────────────────────
function Cell({ className = '', children, ...rest }) {
  return (
    <td
      className={[
        'px-4 py-3 text-sm text-text-primary align-middle',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </td>
  );
}

// ─── Attach sub-components ────────────────────────────────────────────────────
Table.Header = Header;
Table.Body = Body;
Table.Row = Row;
Table.Head = Head;
Table.Cell = Cell;

export default Table;
