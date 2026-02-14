# Design Specifications - Micro-Interactions & Visual Hierarchy

**Document Version:** 1.0  
**Date:** February 2026  
**Author:** Frontend Design Team  
**Status:** Final

---

## Executive Summary

This document defines comprehensive design specifications for micro-interactions and visual hierarchy across the Baby Petite e-commerce platform. These specifications ensure consistent, accessible, and delightful user experiences while maintaining the brand's minimalist aesthetic.

---

## 1. Animation Timing Standards

### 1.1 Duration Scale

| Category | Duration | Use Case |
|----------|----------|----------|
| **Micro-interactions** | 150-200ms | Button hovers, icon transforms, focus states |
| **State transitions** | 200-300ms | Toggle states, selection changes, badge updates |
| **Modal animations** | 300-400ms | Modal open/close, backdrop fade, slide animations |
| **Page transitions** | 400-500ms | Route changes, content swaps |

### 1.2 Easing Functions

| Easing | CSS Value | Use Case |
|--------|-----------|----------|
| **Ease-out** | `cubic-bezier(0, 0, 0.2, 1)` | Entrances, fade-ins, slide-ins |
| **Ease-in** | `cubic-bezier(0.4, 0, 1, 1)` | Exits, fade-outs, slide-outs |
| **Ease-in-out** | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes, hover transitions |
| **Spring** | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Playful bounces, success celebrations |

### 1.3 Tailwind Animation Classes

```css
/* Custom animation utilities to add to tailwind.config.ts */
animations: {
  'fade-in': 'fadeIn 200ms ease-out',
  'fade-out': 'fadeOut 200ms ease-in',
  'slide-up': 'slideUp 300ms ease-out',
  'slide-down': 'slideDown 300ms ease-out',
  'scale-in': 'scaleIn 150ms ease-out',
  'scale-out': 'scaleOut 150ms ease-in',
  'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
  'badge-pop': 'badgePop 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulseSubtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes badgePop {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

---

## 2. Guest Checkout Choice Component

### 2.1 Micro-Interactions

#### Primary Card (Guest Checkout)

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Border | 2px solid #FFD700 | `border-2 border-primary-500` |
| | Background | rgba(255, 215, 0, 0.05) | `bg-primary-50/50` |
| | Shadow | none | - |
| | Transform | none | - |
| **Hover** | Border | 2px solid #E6C200 | `hover:border-primary-600` |
| | Background | rgba(255, 215, 0, 0.1) | `hover:bg-primary-50` |
| | Shadow | 0 4px 12px rgba(0, 0, 0, 0.08) | `hover:shadow-card-hover` |
| | Transform | translateY(-2px) | `hover:-translate-y-0.5` |
| | Transition | 200ms ease-out | `transition-all duration-200` |
| **Focus** | Outline | 2px solid #FFD700 | `focus-visible:ring-2 focus-visible:ring-primary-500` |
| | Ring offset | 2px | `focus-visible:ring-offset-2` |
| | Transition | 150ms ease-out | `transition-all duration-150` |
| **Active/Pressed** | Transform | scale(0.98) | `active:scale-[0.98]` |
| | Transition | 100ms ease-out | `transition-transform duration-100` |

#### Secondary Card (Sign In)

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Border | 1px solid #E5E7EB | `border border-gray-200` |
| | Background | #FFFFFF | `bg-white` |
| | Shadow | none | - |
| **Hover** | Border | 1px solid #D1D5DB | `hover:border-gray-300` |
| | Background | #F9FAFB | `hover:bg-gray-50` |
| | Shadow | 0 2px 8px rgba(0, 0, 0, 0.04) | `hover:shadow-sm` |
| | Transition | 200ms ease-out | `transition-all duration-200` |

#### "Fastest" Badge

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Background | rgba(255, 215, 0, 0.2) | `bg-primary-100` |
| | Text Color | #A68600 | `text-primary-700` |
| | Padding | 2px 10px | `px-2.5 py-0.5` |
| | Border Radius | 9999px | `rounded-full` |
| | Font Size | 12px | `text-xs` |
| | Font Weight | 500 | `font-medium` |
| **Entrance Animation** | Animation | scale + fade | `animate-badge-pop` |
| | Duration | 200ms | - |
| | Delay | 100ms (after card appears) | `animation-delay-100` |

#### Button States

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Background | #FFD700 | `bg-primary-500` |
| | Text | #111827 | `text-gray-900` |
| | Height | 48px | `h-12` |
| | Border Radius | 8px | `rounded-lg` |
| **Hover** | Background | #E6C200 | `hover:bg-primary-600` |
| | Shadow | 0 4px 8px rgba(0, 0, 0, 0.15) | `hover:shadow-button-hover` |
| | Transform | translateY(-1px) | `hover:-translate-y-px` |
| | Transition | 150ms ease-out | `transition-all duration-150` |
| **Focus** | Ring | 2px #FFD700 | `focus-visible:ring-2 focus-visible:ring-primary-500` |
| | Ring Offset | 2px | `focus-visible:ring-offset-2` |
| **Active** | Transform | scale(0.98) | `active:scale-[0.98]` |
| **Loading** | Opacity | 0.7 | `opacity-70` |
| | Cursor | wait | `cursor-wait` |
| | Icon | Spinner animation | `animate-spin` |

### 2.2 Visual Hierarchy

#### Typography Scale

| Element | Font Size | Line Height | Weight | Tailwind Classes |
|---------|-----------|-------------|--------|------------------|
| **Main Heading** | 24px (mobile) / 30px (desktop) | 32px / 36px | 700 | `text-2xl sm:text-3xl font-bold` |
| **Card Title** | 18px | 28px | 600 | `text-lg font-semibold` |
| **Card Description** | 14px | 20px | 400 | `text-sm text-gray-600` |
| **Benefit Text** | 14px | 20px | 400 | `text-sm text-gray-600` |
| **Button Text** | 16px | 24px | 500 | `text-base font-medium` |
| **Security Note** | 12px | 16px | 400 | `text-xs text-gray-500` |

#### Spacing Scale

| Element | Padding/Margin | Tailwind Classes |
|---------|----------------|------------------|
| **Container** | padding: 32px (mobile) / 48px (desktop) | `py-8 px-4 sm:py-12 sm:px-6` |
| **Card** | padding: 24px | `p-6` |
| **Card Gap** | margin-bottom: 16px | `space-y-4` |
| **Icon Container** | 40px × 40px | `w-10 h-10` |
| **Benefits List** | gap: 8px | `gap-2` |
| **Button Margin Top** | margin-top: 16px | `mt-4` |

#### Z-Index Layering

| Element | Z-Index | Tailwind Class |
|---------|---------|----------------|
| **Container** | 0 | `z-0` |
| **Card** | 10 | `z-10` |
| **Badge** | 20 | `z-20` |
| **Focus Ring** | 30 | `z-30` |

---

## 3. Breadcrumbs Component

### 3.1 Micro-Interactions

#### Breadcrumb Link

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Color | #6B7280 | `text-gray-500` |
| | Text Decoration | none | - |
| **Hover** | Color | #111827 | `hover:text-gray-900` |
| | Transition | 150ms ease-out | `transition-colors duration-150` |
| **Focus** | Outline | 2px #FFD700 | `focus-visible:ring-2 focus-visible:ring-primary-500` |
| | Ring Offset | 2px | `focus-visible:ring-offset-2` |
| | Border Radius | 4px | `rounded` |
| **Current Page** | Color | #111827 | `text-gray-900` |
| | Font Weight | 500 | `font-medium` |

#### Home Icon

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Size | 16px × 16px | `w-4 h-4` |
| | Color | #4B5563 | `text-gray-600` |
| **Hover** | Color | #111827 | `hover:text-gray-900` |
| | Transform | scale(1.1) | `hover:scale-110` |
| | Transition | 150ms ease-out | `transition-transform duration-150` |

#### Separator (ChevronRight)

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Size | 16px × 16px | `w-4 h-4` |
| Color | #9CA3AF | `text-gray-400` |
| Margin | 0 4px | `mx-1` |

### 3.2 Visual Hierarchy

#### Typography

| Element | Font Size | Weight | Tailwind Classes |
|---------|-----------|--------|------------------|
| **Breadcrumb Text** | 14px | 400 | `text-sm` |
| **Current Page** | 14px | 500 | `text-sm font-medium` |

#### Spacing

| Element | Value | Tailwind Classes |
|---------|-------|------------------|
| **List Gap** | 4px | `gap-1` |
| **Separator Margin** | 0 4px | `mx-1` |

---

## 4. Mobile Bottom Navigation

### 4.1 Micro-Interactions

#### Navigation Item

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Color | #4B5563 | `text-gray-600` |
| | Background | transparent | - |
| | Transform | none | - |
| **Active** | Color | #FFD700 (darker) | `text-primary-600` |
| | Font Weight | 500 | `font-medium` |
| **Hover** | Color | #111827 | `hover:text-gray-900` |
| | Transition | 150ms ease-out | `transition-colors duration-150` |
| **Focus** | Ring | 2px #FFD700 | `focus-visible:ring-2 focus-visible:ring-primary-500` |
| | Ring Offset | 2px | `focus-visible:ring-offset-2` |
| | Border Radius | 8px | `rounded-lg` |
| **Pressed/Active Tap** | Transform | scale(0.92) | `active:scale-[0.92]` |
| | Transition | 100ms ease-out | `transition-transform duration-100` |

#### Icon Scale Animation

```css
/* Icon tap animation */
.nav-icon:active {
  transform: scale(0.92);
  transition: transform 100ms ease-out;
}

/* Icon release animation */
.nav-icon {
  transform: scale(1);
  transition: transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

#### Cart Badge Pulse

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Background | #FFD700 | `bg-primary-600` |
| | Size | min 18px × 18px | `min-w-[18px] h-[18px]` |
| | Position | top: -8px, right: -8px | `absolute -top-2 -right-2` |
| | Font Size | 12px | `text-xs` |
| **On Item Add** | Animation | scale + fade | `animate-badge-pop` |
| | Duration | 200ms | - |
| | Easing | spring | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` |

#### Active Indicator Animation

```css
/* Active indicator underline */
.active-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background-color: #FFD700;
  border-radius: 1px;
  animation: slideIn 200ms ease-out;
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 24px;
    opacity: 1;
  }
}
```

#### Haptic Feedback Visual Representation

```css
/* Visual feedback simulating haptic response */
.haptic-feedback {
  animation: hapticPulse 100ms ease-out;
}

@keyframes hapticPulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

### 4.2 Visual Hierarchy

#### Icon Sizes

| Element | Size | Tailwind Classes |
|---------|------|------------------|
| **Navigation Icon** | 24px × 24px | `w-6 h-6` |
| **Badge** | min 18px × 18px | `min-w-[18px] h-[18px]` |

#### Typography

| Element | Font Size | Weight | Tailwind Classes |
|---------|-----------|--------|------------------|
| **Label** | 10px | 500 | `text-[10px] font-medium` |

#### Spacing

| Element | Value | Tailwind Classes |
|---------|-------|------------------|
| **Touch Target** | min 44px × 44px | `min-w-[44px] min-h-[44px]` |
| **Horizontal Padding** | 12px | `px-3` |
| **Vertical Padding** | 4px | `py-1` |
| **Label Margin Top** | 2px | `mt-0.5` |
| **Safe Area Bottom** | env(safe-area-inset-bottom) | `pb-[env(safe-area-inset-bottom)]` |

#### Z-Index

| Element | Z-Index | Tailwind Class |
|---------|---------|----------------|
| **Navigation Bar** | 50 | `z-50` |

---

## 5. Security Badges Component

### 5.1 Micro-Interactions

#### Badge Container

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Background | #F9FAFB | `bg-gray-50` |
| | Border | 1px solid #E5E7EB | `border border-gray-200` |
| | Border Radius | 6px | `rounded-md` |
| **Hover** | Background | #F3F4F6 | `hover:bg-gray-100` |
| | Transition | 150ms ease-out | `transition-colors duration-150` |

#### Icon Animation on Hover

```css
/* Subtle icon bounce on hover */
.badge-icon {
  transition: transform 200ms ease-out;
}

.badge:hover .badge-icon {
  transform: scale(1.05);
}
```

#### Tooltip Appearance

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Hidden** | Opacity | 0 | `opacity-0` |
| | Transform | scale(0.95) | `scale-95` |
| | Pointer Events | none | `pointer-events-none` |
| **Visible** | Opacity | 1 | `opacity-100` |
| | Transform | scale(1) | `scale-100` |
| | Transition | 150ms ease-out | `duration-150` |
| **Animation** | Fade + Zoom | - | `animate-in fade-in-0 zoom-in-95` |

#### Tooltip Styling

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Background | #111827 | `bg-gray-900` |
| Text Color | #FFFFFF | `text-white` |
| Font Size | 12px | `text-xs` |
| Padding | 8px 12px | `px-3 py-2` |
| Border Radius | 6px | `rounded-md` |
| Shadow | 0 4px 12px rgba(0, 0, 0, 0.15) | `shadow-lg` |
| Max Width | 200px | `max-w-[200px]` |
| Arrow Size | 8px | `border-4` |

#### Badge Entrance Animation

```css
/* Staggered entrance for badge group */
.badge-enter {
  animation: badgeEnter 300ms ease-out forwards;
}

.badge:nth-child(1) { animation-delay: 0ms; }
.badge:nth-child(2) { animation-delay: 50ms; }
.badge:nth-child(3) { animation-delay: 100ms; }
.badge:nth-child(4) { animation-delay: 150ms; }

@keyframes badgeEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 5.2 Visual Hierarchy

#### Badge Sizes by Variant

| Variant | Container Padding | Icon Size | Text Size | Tailwind Classes |
|---------|-------------------|-----------|-----------|------------------|
| **sm** | 8px 8px | 16px | 12px | `gap-1.5 px-2 py-1`, `w-4 h-4`, `text-xs` |
| **md** | 12px 8px | 20px | 14px | `gap-2 px-3 py-2`, `w-5 h-5`, `text-sm` |
| **lg** | 16px 10px | 24px | 16px | `gap-2.5 px-4 py-2.5`, `w-6 h-6`, `text-base` |

#### Icon-to-Text Spacing

| Size | Gap | Tailwind Class |
|------|-----|----------------|
| sm | 6px | `gap-1.5` |
| md | 8px | `gap-2` |
| lg | 10px | `gap-2.5` |

#### Tooltip Typography

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Font Size | 12px | `text-xs` |
| Line Height | 16px | `leading-4` |
| Font Weight | 400 | `font-normal` |

---

## 6. Stock Indicator Component

### 6.1 Micro-Interactions

#### Badge States

| Status | Background | Border | Text Color | Icon Color |
|--------|------------|--------|------------|------------|
| **In Stock** | #ECFDF5 | #A7F3D0 | #047857 | #059669 |
| **Low Stock** | #FFFBEB | #FCD34D | #B45309 | #D97706 |
| **Out of Stock** | #FEF2F2 | #FECACA | #B91C1C | #DC2626 |

#### Pulse Animation for Low Stock

```css
/* Subtle pulse for urgency */
.low-stock-pulse {
  animation: pulseUrgency 2s ease-in-out infinite;
}

@keyframes pulseUrgency {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
  }
  50% {
    opacity: 0.85;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0);
  }
}
```

#### Color Transition for Status Changes

```css
/* Smooth color transition when stock changes */
.stock-indicator {
  transition: all 300ms ease-in-out;
}

.stock-indicator.updating {
  animation: statusChange 300ms ease-out;
}

@keyframes statusChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
```

#### Progress Bar Fill Animation

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Duration | 300ms | `duration-300` |
| Easing | ease-out | `ease-out` |
| Border Radius | 9999px | `rounded-full` |

```css
/* Progress bar fill animation */
.progress-fill {
  transition: width 300ms ease-out;
  border-radius: 9999px;
}

/* Color based on status */
.progress-fill.in-stock { background-color: #22C55E; }
.progress-fill.low-stock { background-color: #F59E0B; }
.progress-fill.out-of-stock { background-color: #EF4444; }
```

### 6.2 Visual Hierarchy

#### Badge Size Relative to Product Card

| Size | Container Padding | Icon Size | Text Size | Tailwind Classes |
|------|-------------------|-----------|-----------|------------------|
| **sm** | 8px 2px | 12px | 12px | `gap-1 px-2 py-0.5`, `w-3 h-3`, `text-xs` |
| **md** | 10px 4px | 16px | 14px | `gap-1.5 px-2.5 py-1`, `w-4 h-4`, `text-sm` |
| **lg** | 12px 6px | 20px | 16px | `gap-2 px-3 py-1.5`, `w-5 h-5`, `text-base` |

#### Urgency Text Styling

| Element | Font Size | Weight | Tailwind Classes |
|---------|-----------|--------|------------------|
| **Count Number** | inherits | 700 | `font-bold` |
| **"Only X left!"** | 14px (md) | 500 | `text-sm font-medium` |

#### Progress Bar Dimensions

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Height | 8px | `h-2` |
| Border Radius | 9999px | `rounded-full` |
| Background | #F3F4F6 | `bg-gray-100` |

---

## 7. Exit Intent Modal

### 7.1 Micro-Interactions

#### Backdrop Animation

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Hidden** | Opacity | 0 | `opacity-0` |
| | Backdrop Blur | 0 | `backdrop-blur-none` |
| **Visible** | Opacity | 1 | `opacity-100` |
| | Backdrop Blur | 4px | `backdrop-blur-sm` |
| **Animation** | Fade In | 200ms | `animate-in fade-in-0 duration-200` |

```css
/* Backdrop animation */
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  animation: backdropFadeIn 200ms ease-out;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}
```

#### Modal Slide-Up Animation

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Hidden** | Opacity | 0 | `opacity-0` |
| | Transform | translateY(16px) scale(0.95) | `translate-y-4 scale-95` |
| **Visible** | Opacity | 1 | `opacity-100` |
| | Transform | translateY(0) scale(1) | `translate-y-0 scale-100` |
| **Animation** | Zoom + Slide | 300ms | `animate-in zoom-in-95 slide-in-from-bottom-4 duration-300` |

```css
/* Modal entrance */
.modal-enter {
  animation: modalSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Modal exit */
.modal-exit {
  animation: modalSlideDown 200ms ease-in forwards;
}

@keyframes modalSlideDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
}
```

#### Close Button

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Color | #9CA3AF | `text-gray-400` |
| | Background | transparent | - |
| | Size | 20px | `w-5 h-5` |
| | Padding | 8px | `p-2` |
| **Hover** | Color | #4B5563 | `hover:text-gray-600` |
| | Background | #F3F4F6 | `hover:bg-gray-100` |
| | Transition | 150ms ease-out | `transition-colors` |
| **Focus** | Ring | 2px #FFD700 | `focus:ring-2 focus:ring-yellow focus:ring-offset-2` |

#### Form Field Focus States

| State | Property | Value | Tailwind Classes |
|-------|----------|-------|------------------|
| **Default** | Border | 1px solid #E5E7EB | `border border-gray-200` |
| | Background | #FFFFFF | `bg-white` |
| **Focus** | Border | 1px solid #FFD700 | `focus:border-primary-500` |
| | Ring | 2px rgba(255, 215, 0, 0.2) | `focus:ring-2 focus:ring-primary-500/20` |
| | Transition | 150ms ease-out | `transition-all duration-150` |
| **Error** | Border | 1px solid #EF4444 | `border-red-500` |
| | Ring | 2px rgba(239, 68, 68, 0.2) | `ring-2 ring-red-500/20` |

#### Success State Celebration Animation

```css
/* Success celebration */
.success-celebration {
  animation: celebrateSuccess 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes celebrateSuccess {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Icon sparkle */
.sparkle-icon {
  animation: sparkle 600ms ease-out;
}

@keyframes sparkle {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-10deg) scale(1.1);
  }
  75% {
    transform: rotate(10deg) scale(1.1);
  }
}

/* Confetti particles (optional enhancement) */
.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: confettiFall 1s ease-out forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100px) rotate(720deg);
    opacity: 0;
  }
}
```

### 7.2 Visual Hierarchy

#### Modal Dimensions

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Width | 100% | `w-full` |
| Max Width | 448px | `max-w-md` |
| Margin | 16px | `mx-4` |
| Border Radius | 16px | `rounded-2xl` |
| Shadow | 0 25px 50px -12px rgba(0, 0, 0, 0.25) | `shadow-2xl` |

#### Heading Hierarchy

| Element | Font Size | Weight | Color | Tailwind Classes |
|---------|-----------|--------|-------|------------------|
| **Title** | 24px | 700 | #111827 | `text-2xl font-bold text-gray-900` |
| **Description** | 14px | 400 | #4B5563 | `text-gray-600` |
| **Discount Highlight** | 14px | 600 | #111827 | `font-semibold text-gray-900` |

#### Form Field Sizes

| Element | Height | Padding | Font Size | Tailwind Classes |
|---------|--------|---------|-----------|------------------|
| **Input** | 44px | 12px 16px | 16px | `h-11 px-4 text-base` |
| **Icon (left)** | 20px | left: 12px | - | `w-5 h-5 left-3` |

#### CTA Button Sizing

| Property | Value | Tailwind Classes |
|----------|-------|------------------|
| Height | 48px | `h-12` |
| Width | 100% | `w-full` |
| Font Size | 16px | `text-base` |
| Font Weight | 500 | `font-medium` |
| Border Radius | 8px | `rounded-lg` |

#### Content Spacing

| Element | Value | Tailwind Classes |
|---------|-------|------------------|
| **Container Padding** | 24px (mobile) / 32px (desktop) | `p-6 sm:p-8` |
| **Header Gap** | 12px | `space-y-3` |
| **Form Gap** | 16px | `space-y-4` |
| **Footer Margin Top** | 16px | `mt-4` |

---

## 8. Responsive Behavior

### 8.1 Breakpoint Definitions

| Breakpoint | Min Width | Tailwind Prefix |
|------------|-----------|-----------------|
| **Mobile** | 0px | (default) |
| **XS** | 375px | `xs:` |
| **SM** | 640px | `sm:` |
| **MD** | 768px | `md:` |
| **LG** | 1024px | `lg:` |
| **XL** | 1280px | `xl:` |
| **2XL** | 1536px | `2xl:` |

### 8.2 Component Responsive Behavior

#### Guest Checkout Choice

| Breakpoint | Behavior |
|------------|----------|
| **Mobile (< 640px)** | Full width cards, stacked layout, 24px heading |
| **Tablet (640px - 1024px)** | Max width 512px, 30px heading, 2-column benefits |
| **Desktop (> 1024px)** | Same as tablet, hover effects enabled |

#### Mobile Bottom Navigation

| Breakpoint | Behavior |
|------------|----------|
| **Mobile (< 768px)** | Visible, fixed bottom |
| **Tablet/Desktop (≥ 768px)** | Hidden (`md:hidden`) |

#### Security Badges

| Breakpoint | Behavior |
|------------|----------|
| **Mobile (< 640px)** | Compact variant, smaller icons (sm), horizontal scroll if needed |
| **Tablet (640px - 1024px)** | Full variant, medium icons (md), wrap to new line |
| **Desktop (> 1024px)** | Full variant, large icons (lg), horizontal layout |

#### Stock Indicator

| Breakpoint | Behavior |
|------------|----------|
| **Mobile (< 640px)** | Badge or text variant, small size |
| **Tablet (640px - 1024px)** | Any variant, medium size |
| **Desktop (> 1024px)** | Progress bar available, large size |

#### Exit Intent Modal

| Breakpoint | Behavior |
|------------|----------|
| **Mobile (< 640px)** | Full width minus 32px margin, 24px padding |
| **Tablet (640px - 1024px)** | Max width 448px, 32px padding |
| **Desktop (> 1024px)** | Max width 448px, hover effects on close button |

---

## 9. Accessibility Specifications

### 9.1 Focus Management

| Element | Focus Style | Tailwind Classes |
|---------|-------------|------------------|
| **All Interactive** | Visible focus ring | `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` |
| **Buttons** | Ring + slight scale | `focus-visible:ring-2 focus-visible:scale-[1.02]` |
| **Links** | Ring with rounded corners | `focus-visible:ring-2 rounded` |
| **Form Inputs** | Ring + border color change | `focus:ring-2 focus:border-primary-500` |

### 9.2 Color Contrast Requirements

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| **Body Text** | #4B5563 | #FFFFFF | 7.5:1 (AAA) |
| **Heading Text** | #111827 | #FFFFFF | 16.1:1 (AAA) |
| **Button Text** | #111827 | #FFD700 | 8.2:1 (AAA) |
| **Secondary Text** | #6B7280 | #FFFFFF | 5.7:1 (AA) |
| **Disabled Text** | #9CA3AF | #FFFFFF | 3.9:1 (AA Large) |

### 9.3 Motion Preferences

```css
/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.4 Touch Target Sizes

| Element | Minimum Size | Tailwind Classes |
|---------|--------------|------------------|
| **Buttons** | 44px × 44px | `min-h-11 min-w-11` |
| **Navigation Items** | 44px × 44px | `min-w-[44px] min-h-[44px]` |
| **Form Inputs** | 44px height | `h-11` |
| **Icon Buttons** | 44px × 44px | `p-2` (with 20px icon) |

---

## 10. CSS Custom Properties Reference

### 10.1 Animation Variables

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-modal: 400ms;
  
  /* Easings */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-button: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-button-hover: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;
}
```

### 10.2 Z-Index Scale

```css
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
}
```

---

## 11. Implementation Checklist

### 11.1 Guest Checkout Choice
- [ ] Add hover lift effect with shadow transition
- [ ] Implement focus ring styling
- [ ] Add "Fastest" badge entrance animation
- [ ] Implement loading state with spinner
- [ ] Add pressed state scale transform

### 11.2 Mobile Bottom Navigation
- [ ] Implement icon scale on tap
- [ ] Add active indicator animation
- [ ] Implement cart badge pulse animation
- [ ] Add haptic feedback visual representation
- [ ] Ensure 44px touch targets

### 11.3 Security Badges
- [ ] Implement tooltip appearance animation
- [ ] Add icon subtle animation on hover
- [ ] Implement badge entrance animation with stagger
- [ ] Add proper ARIA labels

### 11.4 Stock Indicator
- [ ] Implement pulse animation for low stock
- [ ] Add color transition for status changes
- [ ] Implement progress bar fill animation
- [ ] Add proper ARIA live regions

### 11.5 Exit Intent Modal
- [ ] Implement backdrop fade-in timing
- [ ] Add modal slide-up animation
- [ ] Implement form field focus states
- [ ] Add success state celebration animation
- [ ] Ensure proper focus trapping

---

## 12. Testing Guidelines

### 12.1 Animation Testing
- Test all animations at 60fps
- Verify no layout thrashing during animations
- Test with CPU throttling (4x slowdown)
- Verify animations respect `prefers-reduced-motion`

### 12.2 Accessibility Testing
- Verify all focus states are visible
- Test keyboard navigation for all interactive elements
- Verify color contrast ratios meet WCAG AA
- Test with screen readers (VoiceOver, NVDA)

### 12.3 Cross-Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## Appendix A: Tailwind Class Quick Reference

### Animation Classes
```css
/* Transitions */
.transition-all { transition: all 200ms ease-out; }
.transition-colors { transition: color, background-color 150ms ease-out; }
.transition-transform { transition: transform 150ms ease-out; }

/* Durations */
.duration-100 { transition-duration: 100ms; }
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }

/* Easings */
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
```

### Transform Classes
```css
.scale-95 { transform: scale(0.95); }
.scale-98 { transform: scale(0.98); }
.scale-110 { transform: scale(1.1); }
.-translate-y-0.5 { transform: translateY(-2px); }
.-translate-y-px { transform: translateY(-1px); }
```

### Focus Classes
```css
.focus-visible:ring-2 { outline: none; }
.focus-visible:ring-primary-500 { --tw-ring-color: #FFD700; }
.focus-visible:ring-offset-2 { --tw-ring-offset-width: 2px; }
```
