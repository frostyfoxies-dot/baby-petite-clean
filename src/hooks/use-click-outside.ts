'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook for detecting clicks outside an element
 *
 * Triggers a callback when a click occurs outside the referenced element.
 * Useful for closing dropdowns, modals, and other UI components.
 *
 * @param handler - Callback function to run when clicking outside
 * @param mouseEvent - Mouse event to listen for (default: 'mousedown')
 * @returns Ref to attach to the target element
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
 *
 *   return (
 *     <div ref={ref}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <DropdownMenu />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  mouseEvent: 'mousedown' | 'mouseup' | 'click' = 'mousedown'
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Do nothing if the ref is not set or the click is inside the element
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      handler();
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, mouseEvent]);

  return ref;
}

/**
 * Alternative version that accepts an existing ref
 *
 * @param ref - Existing ref to use
 * @param handler - Callback function to run when clicking outside
 * @param mouseEvent - Mouse event to listen for (default: 'mousedown')
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   useClickOutsideRef(modalRef, onClose);
 *
 *   return (
 *     <div ref={modalRef}>
 *       <ModalContent />
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutsideRef<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  mouseEvent: 'mousedown' | 'mouseup' | 'click' = 'mousedown'
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Do nothing if the ref is not set or the click is inside the element
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      handler();
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, mouseEvent]);
}

export default useClickOutside;
