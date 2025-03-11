import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={twMerge(
        'flex items-center space-x-2 bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg',
        className
      )}
    >
      <AlertTriangle className="w-5 h-5" />
      <span>{message}</span>
    </motion.div>
  );
};