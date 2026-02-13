# WCAG 2.1 AA Accessibility Audit Report

**Document Version:** 1.0  
**Date:** February 2026  
**Auditor:** Frontend Accessibility Team  
**Status:** Complete

---

## Executive Summary

This accessibility audit covers 6 newly created UX components in the Kids Petite e-commerce store. The audit identifies WCAG 2.1 AA compliance issues and provides recommended fixes for each component.

### Components Audited

| Component | File Path | Issues Found | Critical |
|-----------|-----------|--------------|----------|
| Guest Checkout Choice | `src/components/checkout/guest-checkout-choice.tsx` | 5 | 2 |
| Breadcrumbs | `src/components/layout/breadcrumbs.tsx` | 0 | 0 |
| Mobile Bottom Navigation | `src/components/layout/mobile-bottom-nav.tsx` | 1 | 0 |
| Security Badges | `src/components/ui/security-badges.tsx` | 6 | 3 |
| Stock Indicator | `src/components/product/stock-indicator.tsx` | 3 | 1 |
| Exit Intent Modal | `src/components/exit-intent/exit-intent-modal.tsx` | 5 | 3 |

### Severity Definitions

- **Critical**: Prevents users with disabilities from accessing content or functionality
- **Serious**: Significantly impacts the user experience for people with disabilities
- **Moderate**: Makes access difficult but not impossible
- **Minor**: Minor inconvenience for users with disabilities

---

## 1. Guest Checkout Choice Component

**File:** [`src/components/checkout/guest-checkout-choice.tsx`](src/components/checkout/guest-checkout-choice.tsx)

### Issues Found

#### 1.1.1 Non-text Content (Minor)

**Issue:** Decorative icons (`Sparkles`, `User`, `Check`, `ArrowRight`) lack `aria-hidden="true"` attribute.

**Location:** Lines 78, 105, 121, 137, 151

**Impact:** Screen readers may announce decorative icons unnecessarily, creating noise.

**Fix:**
```tsx
<Sparkles className="w-5 h-5 text-primary-600" aria-hidden="true" />
<ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
<User className="w-5 h-5 text-gray-600" aria-hidden="true" />
<Check className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
```

---

#### 2.1.1 Keyboard (Critical)

**Issue:** The primary card (guest checkout option) is not keyboard accessible. The card is a `<div>` with an `onClick` handler but no keyboard event handlers.

**Location:** Lines 68-109

**Impact:** Keyboard users cannot activate the guest checkout option directly from the card. They must tab to the button inside, which may not be immediately obvious.

**Fix:** Add keyboard handlers or restructure as a button:
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGuestCheckout();
    }
  }}
  // ... rest of props
>
```

---

#### 2.4.7 Focus Visible (Serious)

**Issue:** The card containers lack visible focus indicators for keyboard navigation.

**Location:** Lines 68-109, 112-166

**Impact:** Keyboard users cannot see which card is focused.

**Fix:**
```tsx
className={cn(
  'relative rounded-xl border-2 border-primary-500 bg-primary-50/50',
  'p-6 transition-all duration-200',
  'hover:border-primary-600 hover:bg-primary-50',
  'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
)}
```

---

#### 2.5.5 Target Size (Moderate)

**Issue:** The "Fastest" badge is small and while not interactive, the overall card touch target could be improved.

**Location:** Lines 89-91

**Impact:** Touch users may have difficulty interacting with the card on mobile devices.

**Fix:** Ensure the entire card maintains minimum 44x44px touch target for the clickable area.

---

#### 4.1.2 Name, Role, Value (Serious)

**Issue:** The card structure uses semantic `<div>` elements for interactive content without proper ARIA roles.

**Location:** Lines 68-109

**Impact:** Screen readers may not announce the card as interactive.

**Fix:** Add appropriate ARIA attributes or use semantic `<button>` elements.

---

## 2. Breadcrumbs Component

**File:** [`src/components/layout/breadcrumbs.tsx`](src/components/layout/breadcrumbs.tsx)

### Issues Found

**No issues found.** The component is fully WCAG 2.1 AA compliant.

### Compliance Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.3.1 Info and Relationships | ✅ Pass | Uses `<nav>`, `<ol>`, `<li>` elements properly |
| 2.4.4 Link Purpose | ✅ Pass | Link text is descriptive |
| 2.4.7 Focus Visible | ✅ Pass | Has focus-visible styles |
| 4.1.2 Name, Role, Value | ✅ Pass | `aria-label="Breadcrumb"` on nav, `aria-current="page"` on current page |
| 1.1.1 Non-text Content | ✅ Pass | Home icon and separators have `aria-hidden="true"` |

---

## 3. Mobile Bottom Navigation Component

**File:** [`src/components/layout/mobile-bottom-nav.tsx`](src/components/layout/mobile-bottom-nav.tsx)

### Issues Found

#### 2.3.2 Animation from Interactions (Moderate)

**Issue:** Animation classes (`animate-in fade-in zoom-in`) do not respect `prefers-reduced-motion` media query.

**Location:** Line 160

**Impact:** Users with vestibular disorders may experience discomfort from animations.

**Fix:**
```tsx
className={cn(
  'absolute -top-2 -right-2',
  'flex items-center justify-center',
  'min-w-[18px] h-[18px] px-1',
  'text-xs font-medium text-white',
  'bg-primary-600 rounded-full',
  'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-200'
)}
```

Or add to global CSS:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-in, .fade-in, .zoom-in {
    animation: none !important;
  }
}
```

---

### Compliance Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | ✅ Pass | Icons have `aria-hidden="true"` |
| 2.4.7 Focus Visible | ✅ Pass | Has focus-visible styles |
| 2.5.5 Target Size | ✅ Pass | Minimum 44x44px touch targets |
| 4.1.2 Name, Role, Value | ✅ Pass | `aria-current="page"` for active state, cart count in `aria-label` |

---

## 4. Security Badges Component

**File:** [`src/components/ui/security-badges.tsx`](src/components/ui/security-badges.tsx)

### Issues Found

#### 1.1.1 Non-text Content (Minor)

**Issue:** Icons inside badge components lack `aria-hidden="true"` attribute.

**Location:** Lines 90, 95, 100, 105, 209, 292, 318

**Impact:** Screen readers may announce icon elements redundantly with the label.

**Fix:**
```tsx
<Lock className="w-full h-full" aria-hidden="true" />
```

---

#### 2.1.1 Keyboard (Critical)

**Issue:** Tooltips only appear on mouse hover (`onMouseEnter`/`onMouseLeave`), not on keyboard focus.

**Location:** Lines 149-153

**Impact:** Keyboard users cannot access tooltip information.

**Fix:**
```tsx
function BadgeTooltip({ 
  children, 
  content 
}: { 
  children: React.ReactNode; 
  content: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          role="tooltip"
          // ... tooltip content
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

---

#### 2.4.7 Focus Visible (Serious)

**Issue:** Badge containers lack visible focus indicators.

**Location:** Lines 198-206, 282-296

**Impact:** Keyboard users cannot see which badge is focused.

**Fix:**
```tsx
className={cn(
  'inline-flex items-center rounded-md',
  'bg-gray-50 border border-gray-200',
  'transition-colors hover:bg-gray-100',
  'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
  sizeClass.container,
  className
)}
```

---

#### 4.1.2 Name, Role, Value (Critical)

**Issue:** Using `role="img"` on `<div>` elements that contain interactive content (tooltip triggers) is incorrect. The `role="img"` should only be used for static images.

**Location:** Lines 206, 289

**Impact:** Screen readers may not properly announce the interactive nature of the badges.

**Fix:** Remove `role="img"` and use proper ARIA attributes:
```tsx
<div
  className={cn(
    'inline-flex items-center rounded-md',
    'bg-gray-50 border border-gray-200',
    'transition-colors hover:bg-gray-100',
    sizeClass.container,
    className
  )}
  tabIndex={0}
  aria-label={`${config.label}: ${config.description}`}
>
```

---

#### 4.1.2 Name, Role, Value (Serious)

**Issue:** In the minimal variant, icons use `title` attribute which is not accessible.

**Location:** Line 318

**Impact:** Screen readers may not announce the title attribute consistently.

**Fix:**
```tsx
<div
  key={type}
  className={cn('text-green-600', sizeClass.icon)}
  aria-label={badgeConfig[type].label}
  role="img"
>
  {badgeConfig[type].icon}
</div>
```

---

#### 1.4.3 Contrast (Minimum) (Moderate)

**Issue:** Need to verify text contrast ratios for `text-gray-700` on `bg-gray-50`.

**Location:** Line 213

**Impact:** May not meet 4.5:1 contrast ratio requirement.

**Analysis:**
- `text-gray-700` (#374151) on `bg-gray-50` (#F9FAFB)
- Contrast ratio: ~9.8:1 ✅ Passes

---

## 5. Stock Indicator Component

**File:** [`src/components/product/stock-indicator.tsx`](src/components/product/stock-indicator.tsx)

### Issues Found

#### 1.1.1 Non-text Content (Minor)

**Issue:** Status icons lack `aria-hidden="true"` attribute.

**Location:** Lines 93, 101, 109, 178, 266

**Impact:** Screen readers may announce icon elements redundantly.

**Fix:**
```tsx
<CheckCircle className="w-full h-full" aria-hidden="true" />
```

---

#### 1.4.1 Use of Color (Critical)

**Issue:** In the `StockText` variant, status is conveyed by color alone (colored dot without icon).

**Location:** Lines 221-228

**Impact:** Users with color vision deficiencies may not be able to distinguish stock status.

**Fix:** Add a text indicator or icon alongside the color:
```tsx
<span
  className={cn(
    'w-2 h-2 rounded-full',
    status === 'in-stock' && 'bg-green-500',
    status === 'low-stock' && 'bg-amber-500',
    status === 'out-of-stock' && 'bg-red-500'
  )}
  aria-hidden="true"
/>
<span className={cn(config.textColor, sizeClass.text)}>
  {shouldShowCount ? (
    <>
      Only <span className="font-semibold">{available}</span> left!
    </>
  ) : (
    config.label // This provides text alternative to color
  )}
</span>
```

**Note:** The text label ("In Stock", "Low Stock", "Out of Stock") already provides a non-color indicator, so this is partially compliant. However, the dot alone would not be sufficient.

---

#### 2.3.2 Animation from Interactions (Moderate)

**Issue:** The `animate-pulse` animation on low stock items does not respect `prefers-reduced-motion`.

**Location:** Lines 172, 380

**Impact:** Users with vestibular disorders may experience discomfort.

**Fix:**
```tsx
className={cn(
  'inline-flex items-center rounded-md border font-medium',
  config.bgColor,
  config.borderColor,
  config.textColor,
  sizeClass.container,
  status === 'low-stock' && 'motion-safe:animate-pulse',
  className
)}
```

---

### Compliance Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| 4.1.3 Status Messages | ✅ Pass | Uses `role="status"` and `aria-live="polite"` |
| 4.1.2 Name, Role, Value | ✅ Pass | Proper ARIA live regions |

---

## 6. Exit Intent Modal Component

**File:** [`src/components/exit-intent/exit-intent-modal.tsx`](src/components/exit-intent/exit-intent-modal.tsx)

### Issues Found

#### 1.1.1 Non-text Content (Minor)

**Issue:** Decorative icons (`X`, `Gift`, `Mail`, `Sparkles`) lack `aria-hidden="true"`.

**Location:** Lines 170, 179, 204, 247

**Impact:** Screen readers may announce decorative icons.

**Fix:**
```tsx
<X className="w-5 h-5" aria-hidden="true" />
<Gift className="w-8 h-8 text-yellow-600" aria-hidden="true" />
<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
<Sparkles className="w-8 h-8 text-green-600" aria-hidden="true" />
```

---

#### 2.1.2 No Keyboard Trap (Critical)

**Issue:** Focus is not trapped within the modal. Users can tab outside the modal content.

**Location:** Entire component

**Impact:** Keyboard users can navigate to elements behind the modal, causing confusion.

**Fix:** Implement focus trap:
```tsx
import { useRef, useEffect } from 'react';

// Inside component
const modalRef = useRef<HTMLDivElement>(null);
const previousActiveElement = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (isOpen) {
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    // Focus the modal
    modalRef.current?.focus();
    
    // Handle focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      previousActiveElement.current?.focus();
    };
  }
}, [isOpen]);
```

---

#### 2.4.3 Focus Order (Critical)

**Issue:** Focus is not automatically moved to the modal when it opens.

**Location:** Component mount

**Impact:** Screen reader users may not realize the modal has opened.

**Fix:**
```tsx
useEffect(() => {
  if (isOpen && modalRef.current) {
    // Find the first focusable element or the close button
    const firstFocusable = modalRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    firstFocusable?.focus();
  }
}, [isOpen]);
```

---

#### 2.4.7 Focus Visible (Serious)

**Issue:** Close button uses non-standard focus ring color (`focus:ring-yellow`).

**Location:** Line 166

**Impact:** Focus indicator may not be visible or consistent with design system.

**Fix:**
```tsx
className={cn(
  'absolute top-4 right-4 p-2 rounded-full',
  'text-gray-400 hover:text-gray-600',
  'hover:bg-gray-100 transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
)}
```

---

#### 3.3.2 Labels or Instructions (Moderate)

**Issue:** Email input uses `placeholder` as the only label. While `aria-label` is present, a visible label is preferred.

**Location:** Lines 248-256

**Impact:** Users with cognitive disabilities may benefit from a persistent visible label.

**Fix:** Add a visible label or use `aria-describedby` for additional context:
```tsx
<div className="relative">
  <label htmlFor="exit-email" className="sr-only">
    Email address
  </label>
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
  <Input
    id="exit-email"
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="pl-10"
    aria-describedby={error ? 'email-error' : 'email-hint'}
  />
</div>
<p id="email-hint" className="sr-only">
  Enter your email to receive your discount code
</p>
```

---

### Compliance Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| 2.1.1 Keyboard | ✅ Pass | Escape key closes modal |
| 4.1.2 Name, Role, Value | ✅ Pass | Has `aria-modal="true"` and `aria-labelledby` |
| 3.3.1 Error Identification | ✅ Pass | Error message with `role="alert"` |

---

## Summary of Required Fixes

### Critical Issues (6)

1. **guest-checkout-choice.tsx**: Add keyboard handlers for card interaction
2. **security-badges.tsx**: Make tooltips keyboard accessible
3. **security-badges.tsx**: Fix incorrect `role="img"` on interactive elements
4. **exit-intent-modal.tsx**: Implement focus trap
5. **exit-intent-modal.tsx**: Implement focus management on open
6. **stock-indicator.tsx**: Ensure color is not the only status indicator (partially compliant)

### Serious Issues (4)

1. **guest-checkout-choice.tsx**: Add visible focus indicators to cards
2. **guest-checkout-choice.tsx**: Add proper ARIA roles to interactive cards
3. **security-badges.tsx**: Add visible focus indicators to badges
4. **exit-intent-modal.tsx**: Fix focus ring color on close button

### Moderate Issues (3)

1. **mobile-bottom-nav.tsx**: Respect `prefers-reduced-motion`
2. **stock-indicator.tsx**: Respect `prefers-reduced-motion`
3. **exit-intent-modal.tsx**: Add visible label for email input

### Minor Issues (5)

1. **guest-checkout-choice.tsx**: Add `aria-hidden` to decorative icons
2. **security-badges.tsx**: Add `aria-hidden` to decorative icons
3. **security-badges.tsx**: Replace `title` attribute with proper ARIA
4. **stock-indicator.tsx**: Add `aria-hidden` to decorative icons
5. **exit-intent-modal.tsx**: Add `aria-hidden` to decorative icons

---

## Testing Recommendations

### Manual Testing

1. **Keyboard Navigation**: Test all interactive elements using Tab, Shift+Tab, Enter, Space, and Escape keys
2. **Screen Reader Testing**: Test with VoiceOver (Mac), NVDA (Windows), or JAWS
3. **Color Contrast**: Use WebAIM Contrast Checker or browser DevTools
4. **Zoom Testing**: Test at 200% browser zoom and 400% zoom for reflow

### Automated Testing

1. **axe DevTools**: Run axe accessibility audit in browser DevTools
2. **Lighthouse**: Run accessibility audit in Chrome DevTools
3. **jest-axe**: Add accessibility assertions to unit tests
4. **pa11y**: Add to CI/CD pipeline for automated accessibility testing

### Recommended Test Commands

```bash
# Install testing dependencies
npm install --save-dev jest-axe @testing-library/jest-dom

# Run accessibility tests
npm run test:a11y
```

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
