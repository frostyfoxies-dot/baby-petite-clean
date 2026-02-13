'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the CopyButton component
 */
export interface CopyButtonProps {
  /** The text to copy to clipboard */
  text: string;
  /** Optional label for accessibility (defaults to "Copy to clipboard") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label next to icon */
  showLabel?: boolean;
  /** Custom success message duration in ms */
  successDuration?: number;
}

/**
 * Size configuration for the button
 */
const sizeConfig = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * CopyButton Component
 * 
 * A button that copies text to the clipboard with visual feedback.
 * Shows a checkmark briefly after successful copy.
 * 
 * @example
 * ```tsx
 * <CopyButton text="ORDER-123" />
 * <CopyButton text={trackingNumber} label="Copy tracking number" showLabel />
 * <CopyButton text={address} size="lg" className="ml-2" />
 * ```
 */
export function CopyButton({
  text,
  label = 'Copy to clipboard',
  className,
  size = 'md',
  showLabel = false,
  successDuration = 2000,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Reset after duration
      setTimeout(() => {
        setCopied(false);
      }, successDuration);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [text, successDuration]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md transition-colors',
        'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeConfig[size],
        className
      )}
      aria-label={copied ? 'Copied!' : label}
      title={copied ? 'Copied!' : label}
    >
      {copied ? (
        <>
          <Check className={cn(iconSizeConfig[size], 'text-green-500')} />
          {showLabel && <span className="text-sm text-green-600">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className={iconSizeConfig[size]} />
          {showLabel && <span className="text-sm">{label}</span>}
        </>
      )}
    </button>
  );
}
