import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { twMerge } from 'tailwind-merge';

interface TooltipProps {
  id: string;
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ id, content, children, className }) => {
  return (
    <>
      <div
        data-tooltip-id={id}
        className={twMerge('cursor-help', className)}
      >
        {children}
      </div>
      <ReactTooltip
        id={id}
        content={content}
        className="z-50 max-w-xs bg-surface text-text border border-border rounded-lg shadow-lg p-2 text-sm"
      />
    </>
  );
};