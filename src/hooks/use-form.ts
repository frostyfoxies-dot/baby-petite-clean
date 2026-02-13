'use client';

import { useState, useCallback, useMemo, type ChangeEvent, type FocusEvent } from 'react';

/**
 * Validation function type
 */
type ValidationFunction<T> = (values: T) => Record<string, string>;

/**
 * Form hook options
 */
interface UseFormOptions<T> {
  /** Initial form values */
  initialValues: T;
  /** Validation function */
  validate?: ValidationFunction<T>;
  /** Callback when form is submitted successfully */
  onSubmit?: (values: T) => Promise<void> | void;
}

/**
 * Form hook return type
 */
interface UseFormReturn<T> {
  /** Current form values */
  values: T;
  /** Validation errors by field */
  errors: Record<string, string>;
  /** Whether a field has been touched */
  touched: Record<string, boolean>;
  /** Set a single field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Handle input change event */
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Handle input blur event */
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Handle form submission */
  handleSubmit: (onSubmit?: (values: T) => Promise<void> | void) => (e: React.FormEvent) => Promise<void>;
  /** Whether the form is valid */
  isValid: boolean;
  /** Whether the form is submitting */
  isSubmitting: boolean;
  /** Reset form to initial values */
  reset: () => void;
  /** Set a field error */
  setError: (field: string, error: string) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Set a field as touched */
  setTouched: (field: string) => void;
  /** Whether a specific field has an error */
  hasError: (field: string) => boolean;
  /** Get error message for a field */
  getError: (field: string) => string | undefined;
}

/**
 * Hook for generic form handling with validation
 *
 * Provides comprehensive form state management including values,
 * errors, touched states, and submission handling.
 *
 * @typeParam T - Form values type
 * @param options - Form configuration options
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * function LoginForm() {
 *   const {
 *     values,
 *     errors,
 *     handleChange,
 *     handleBlur,
 *     handleSubmit,
 *     isSubmitting,
 *     isValid,
 *   } = useForm<LoginForm>({
 *     initialValues: { email: '', password: '' },
 *     validate: (values) => {
 *       const errors: Record<string, string> = {};
 *       if (!values.email) errors.email = 'Email is required';
 *       if (!values.password) errors.password = 'Password is required';
 *       return errors;
 *     },
 *     onSubmit: async (values) => {
 *       await signIn(values);
 *     },
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit()}>
 *       <input
 *         name="email"
 *         value={values.email}
 *         onChange={handleChange}
 *         onBlur={handleBlur}
 *       />
 *       {errors.email && <span>{errors.email}</span>}
 *       <button type="submit" disabled={!isValid || isSubmitting}>
 *         Sign In
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate form and return errors
   */
  const runValidation = useCallback(
    (vals: T): Record<string, string> => {
      if (!validate) return {};
      return validate(vals);
    },
    [validate]
  );

  /**
   * Whether the form is valid
   */
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Set a single field value
   */
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState((prev) => {
        const newValues = { ...prev, [field]: value };
        // Re-validate on change
        if (validate) {
          const validationErrors = runValidation(newValues);
          setErrors(validationErrors);
        }
        return newValues;
      });
    },
    [runValidation, validate]
  );

  /**
   * Set multiple field values
   */
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState((prev) => {
        const updated = { ...prev, ...newValues };
        if (validate) {
          const validationErrors = runValidation(updated);
          setErrors(validationErrors);
        }
        return updated;
      });
    },
    [runValidation, validate]
  );

  /**
   * Handle input change event
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
      setValue(name as keyof T, parsedValue as T[keyof T]);
    },
    [setValue]
  );

  /**
   * Handle input blur event
   */
  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouchedState((prev) => ({ ...prev, [name]: true }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (customOnSubmit?: (values: T) => Promise<void> | void) => {
      return async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<string, boolean>
        );
        setTouchedState(allTouched);

        // Validate
        const validationErrors = runValidation(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
          return;
        }

        // Submit
        const submitFn = customOnSubmit || onSubmit;
        if (submitFn) {
          setIsSubmitting(true);
          try {
            await submitFn(values);
          } catch (error) {
            console.error('Form submission error:', error);
          } finally {
            setIsSubmitting(false);
          }
        }
      };
    },
    [values, runValidation, onSubmit]
  );

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set a field error
   */
  const setError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Set a field as touched
   */
  const setTouched = useCallback((field: string) => {
    setTouchedState((prev) => ({ ...prev, [field]: true }));
  }, []);

  /**
   * Check if a field has an error
   */
  const hasError = useCallback(
    (field: string) => {
      return touched[field] && !!errors[field];
    },
    [errors, touched]
  );

  /**
   * Get error message for a field
   */
  const getError = useCallback(
    (field: string) => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    isSubmitting,
    reset,
    setError,
    clearErrors,
    setTouched,
    hasError,
    getError,
  };
}

export default useForm;
