import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={twMerge(
        'bg-surface border border-border rounded-xl p-6 shadow-lg theme-transition',
        className
      )}
    >
      {children}
    </motion.div>
  );
};