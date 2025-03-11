import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'primary-dark' | 'secondary-dark' | 'outline-dark';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
      'primary-dark': 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-400',
      'secondary-dark': 'bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-500',
      'outline-dark': 'border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-500/10 focus:ring-indigo-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={twMerge(
          baseStyles,
          variants[variant],
          sizes[size],
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;