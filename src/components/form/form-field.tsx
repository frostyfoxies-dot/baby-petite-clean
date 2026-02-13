'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '@/components/ui/input';
import { Textarea, TextareaProps } from '@/components/ui/textarea';
import { Select, SelectProps } from '@/components/ui/select';

/**
 * Form field component props
 */
export interface FormFieldProps {
  /**
   * Field label
   */
  label?: string;
  /**
   * Field name
   */
  name: string;
  /**
   * Field type
   * @default "text"
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  /**
   * Field placeholder
   */
  placeholder?: string;
  /**
   * Field value
   */
  value?: string | number;
  /**
   * Default value
   */
  defaultValue?: string | number;
  /**
   * Callback when value changes
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /**
   * Callback when field is blurred
   */
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /**
   * Error message
   */
  error?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the field is read-only
   * @default false
   */
  readOnly?: boolean;
  /**
   * Field size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Left icon
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon
   */
  rightIcon?: React.ReactNode;
  /**
   * Select options (for type="select")
   */
  options?: { value: string; label: string }[];
  /**
   * Textarea rows (for type="textarea")
   */
  rows?: number;
  /**
   * Max length (for text inputs)
   */
  maxLength?: number;
  /**
   * Additional class name for the field
   */
  fieldClassName?: string;
  /**
   * Additional class name for the wrapper
   */
  className?: string;
  /**
   * Additional props for the input
   */
  inputProps?: InputProps | TextareaProps | SelectProps;
}

/**
 * Form field with label and error
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 *   error={errors.email}
 * />
 * ```
 */
export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  leftIcon,
  rightIcon,
  options,
  rows = 4,
  maxLength,
  fieldClassName,
  className,
  inputProps,
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const errorId = `error-${name}`;
  const helperId = `helper-${name}`;

  const hasError = !!error;

  const renderField = () => {
    const commonProps = {
      id: fieldId,
      name,
      placeholder,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      readOnly,
      required,
      error: hasError,
      size,
      className: fieldClassName,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : helperText ? helperId : undefined,
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...(commonProps as TextareaProps)}
            rows={rows}
            maxLength={maxLength}
            {...(inputProps as TextareaProps)}
          />
        );
      case 'select':
        return (
          <Select
            {...(commonProps as SelectProps)}
            options={options || []}
            {...(inputProps as SelectProps)}
          />
        );
      default:
        return (
          <Input
            {...(commonProps as InputProps)}
            type={type}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            maxLength={maxLength}
            {...(inputProps as InputProps)}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {hasError && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      
      {!hasError && helperText && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
