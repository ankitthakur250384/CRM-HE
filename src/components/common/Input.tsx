import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  name?: string;
  id?: string;
}

export function Input({ className = '', error, leftIcon, rightIcon, name, id, ...props }: InputProps) {
  const inputProps = { ...props };

  const inputName = name || id || props.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'input_field';

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}
      <input
        name={inputName}
        id={id || inputName}
        className={`
          block w-full rounded-md
          border-gray-300 shadow-sm
          focus:border-primary-500 focus:ring-primary-500
          disabled:bg-gray-100 disabled:text-gray-500
          text-sm
          ${error ? 'border-error-300' : 'border-gray-300'}
          ${leftIcon ? 'pl-10' : ''}
          ${rightIcon ? 'pr-10' : ''}
          ${className}
        `}
        {...inputProps}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightIcon}
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}