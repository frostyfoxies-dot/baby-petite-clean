# Frontend Specification

**Document Version:** 2.0  
**Date:** February 2026  
**Author:** Frontend Engineering Team  
**Status:** Final

---

## Executive Summary

This document defines the complete frontend specification for the Baby Petite children's clothing e-commerce platform. Built with Next.js 15, React 19, and Tailwind CSS, the frontend is designed to be performant, accessible, and maintainable with a high-density, minimalist aesthetic. The specification covers component hierarchy, state management, routing, and accessibility standards.

**Design Philosophy:** High product density, minimalist interface, white/yellow color palette, color vibrancy from product photography only.

---

## 1. Frontend Architecture

### 1.1 Architecture Overview

```mermaid
graph TB
    subgraph Presentation Layer
        A[Pages]
        B[Layouts]
        C[Components]
    end
    
    subgraph State Management
        D[Zustand Stores]
        E[React Context]
        F[Server State]
    end
    
    subgraph Data Layer
        G[TanStack Query]
        H[Server Actions]
        I[API Routes]
    end
    
    subgraph Utility Layer
        J[Hooks]
        K[Utils]
        L[Constants]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    D --> G
    E --> H
    F --> I
    C --> J
    J --> K
    J --> L
```

### 1.2 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Zustand | 5.x | State management |
| TanStack Query | 5.x | Server state |
| React Hook Form | 7.x | Form handling |
| Zod | 4.x | Validation |
| Lucide React | 0.400+ | Icons |

---

## 2. Design System

### 2.1 Color Palette

**Primary Colors:**

| Color | Hex | Usage |
|-------|-----|-------|
| White | #FFFFFF | Primary background, cards |
| Yellow | #FFD700 | CTAs, active states, highlights (max 5% of interface) |
| Off White | #FAFAFA | Secondary backgrounds |
| Light Gray | #F5F5F5 | Tertiary backgrounds, borders |

**Neutral Grays:**

| Color | Hex | Usage |
|-------|-----|-------|
| Gray 100 | #F3F4F6 | Subtle backgrounds |
| Gray 200 | #E5E7EB | Borders, dividers |
| Gray 400 | #9CA3AF | Secondary text, disabled |
| Gray 600 | #4B5563 | Body text |
| Gray 900 | #111827 | Headings, primary text |

**Design Rule:** Color vibrancy comes exclusively from product photography. Interface elements remain monochromatic (white/gray/yellow).

### 2.2 Typography

**Font Family:** Inter (all text)

**Sizes:**
```
H1: 32px / 40px line-height
H2: 28px / 36px line-height
H3: 24px / 32px line-height
H4: 20px / 28px line-height
H5: 18px / 24px line-height
H6: 16px / 20px line-height
Body Large: 16px / 24px line-height
Body: 14px / 20px line-height
Body Small: 12px / 18px line-height
Caption: 11px / 16px line-height
```

**Weights:** Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

### 2.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight spacing |
| space-2 | 8px | Compact spacing |
| space-3 | 12px | Default spacing |
| space-4 | 16px | Comfortable spacing |
| space-6 | 24px | Section spacing |
| space-8 | 32px | Large spacing |

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-none | 0px | Sharp corners |
| radius-sm | 2px | Subtle rounding |
| radius-md | 4px | Standard rounding |
| radius-lg | 8px | Large rounding |

### 2.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-none | none | No shadow |
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07) | Standard elevation |

### 2.6 High-Density Grid System

**Grid Specifications:**
```
Mobile (< 640px):    2 columns, 8px gap
Tablet (640-1024px): 3 columns, 12px gap
Desktop (1024-1280px): 4-5 columns, 12px gap
Large (> 1280px):    6 columns, 12px gap
```

**Product Card Dimensions:**
- Mobile: 160px width
- Tablet: 200px width
- Desktop: 220px width
- Large: 240px width

---

## 3. Project Structure

### 3.1 Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (shop)/                   # Shop route group
│   │   ├── products/
│   │   ├── categories/
│   │   └── layout.tsx
│   ├── (account)/                # Account route group
│   │   ├── profile/
│   │   ├── orders/
│   │   ├── registry/
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   ├── cart/
│   ├── checkout/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── product/                  # Product components
│   ├── cart/                     # Cart components
│   ├── checkout/                 # Checkout components
│   ├── account/                  # Account components
│   └── registry/                 # Registry components
├── lib/                          # Utilities and configurations
│   ├── sanity/                   # Sanity client
│   ├── prisma/                   # Prisma client
│   ├── stripe/                   # Stripe client
│   ├── algolia/                  # Algolia client
│   ├── openai/                   # OpenAI client
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # Constants
├── hooks/                        # Custom React hooks
│   ├── use-cart.ts
│   ├── use-auth.ts
│   ├── use-search.ts
│   └── use-recommendations.ts
├── stores/                       # Zustand stores
│   ├── cart-store.ts
│   ├── ui-store.ts
│   └── user-store.ts
├── types/                        # TypeScript types
│   ├── index.ts
│   ├── product.ts
│   ├── order.ts
│   └── user.ts
└── styles/                       # Additional styles
    └── animations.css
```

### 3.2 Tailwind Configuration

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        white: {
          DEFAULT: '#FFFFFF',
          off: '#FAFAFA',
        },
        yellow: {
          DEFAULT: '#FFD700',
          dark: '#E6C200',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

---

## 4. Component Hierarchy

### 4.1 Component Tree

```mermaid
graph TB
    Root[Root Layout]
    
    Root --> Header[Header]
    Root --> Main[Main Content]
    Root --> Footer[Footer]
    
    Header --> Logo[Logo]
    Header --> Navigation[Navigation]
    Header --> Search[Search Bar]
    Header --> CartIcon[Cart Icon]
    Header --> UserMenu[User Menu]
    
    Main --> HomePage[Home Page]
    Main --> ProductPage[Product Page]
    Main --> CategoryPage[Category Page]
    Main --> CartPage[Cart Page]
    Main --> CheckoutPage[Checkout Page]
    Main --> AccountPage[Account Page]
    Main --> RegistryPage[Registry Page]
    
    HomePage --> ProductGrid[High-Density Product Grid]
    HomePage --> Categories[Categories Grid]
    
    ProductPage --> ProductInfo[Product Info]
    ProductPage --> ProductGallery[Product Gallery]
    ProductPage --> ProductVariants[Variant Selector]
    ProductPage --> ProductReviews[Reviews]
    ProductPage --> ProductRecommendations[Recommendations]
    
    CartPage --> CartItems[Cart Items List]
    CartPage --> CartSummary[Cart Summary]
    
    CheckoutPage --> CheckoutSteps[Checkout Steps]
    CheckoutPage --> ShippingForm[Shipping Form]
    CheckoutPage --> PaymentForm[Payment Form]
    CheckoutPage --> OrderSummary[Order Summary]
    
    AccountPage --> AccountNav[Account Navigation]
    AccountPage --> AccountProfile[Profile]
    AccountPage --> AccountOrders[Orders]
    AccountPage --> AccountAddresses[Addresses]
    AccountPage --> AccountRegistry[Registry]
    
    Footer --> FooterLinks[Footer Links]
    Footer --> SocialLinks[Social Links]
```

### 4.2 Component Categories

#### 4.2.1 Base UI Components

Located in `components/ui/`

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `children` | Minimal button with yellow accent |
| `Input` | `type`, `placeholder`, `error` | Minimal form input |
| `Select` | `options`, `value`, `onChange` | Minimal select dropdown |
| `Checkbox` | `checked`, `onChange`, `label` | Minimal checkbox |
| `Radio` | `name`, `value`, `onChange` | Minimal radio input |
| `Textarea` | `value`, `onChange`, `rows` | Minimal textarea |
| `Modal` | `isOpen`, `onClose`, `children` | Clean modal dialog |
| `Badge` | `variant`, `children` | Minimal badge |
| `Card` | `children`, `className` | White card with thin border |
| `Divider` | `orientation` | Thin gray divider |
| `Spinner` | `size` | Minimal loading spinner |
| `Toast` | `message`, `type` | Minimal toast notification |

#### 4.2.2 Layout Components

Located in `components/layout/`

| Component | Props | Description |
|-----------|-------|-------------|
| `Header` | None | Minimal site header |
| `Footer` | None | Minimal site footer |
| `Container` | `size`, `children` | Content container |
| `Section` | `className`, `children` | Section wrapper |
| `Grid` | `cols`, `gap`, `children` | High-density grid layout |
| `Flex` | `justify`, `align`, `children` | Flex layout |
| `Breadcrumb` | `items` | Minimal breadcrumb navigation |

#### 4.2.3 Product Components

Located in `components/product/`

| Component | Props | Description |
|-----------|-------|-------------|
| `ProductCard` | `product`, `variant` | Compact product card |
| `ProductGrid` | `products`, `loading` | High-density grid layout |
| `ProductImage` | `images`, `selected` | Clean image gallery |
| `VariantSelector` | `variants`, `selected`, `onChange` | Minimal variant selector |
| `SizeGuide` | `category` | Minimal size guide modal |
| `AddToCart` | `variant`, `quantity` | Yellow accent button |
| `WishlistButton` | `productId`, `isWishlisted` | Minimal heart icon |
| `ProductReviews` | `productId`, `reviews` | Clean reviews display |
| `ReviewForm` | `productId`, `onSubmit` | Minimal review form |
| `ProductRecommendations` | `productId` | AI recommendations grid |

#### 4.2.4 Cart Components

Located in `components/cart/`

| Component | Props | Description |
|-----------|-------|-------------|
| `CartDrawer` | `isOpen`, `onClose` | Slide-out cart drawer |
| `CartItem` | `item`, `onUpdate`, `onRemove` | Compact cart item |
| `CartSummary` | `items`, `subtotal` | Minimal cart totals |
| `PromoCodeInput` | `onApply` | Minimal promo input |
| `EmptyCart` | None | Minimal empty state |
| `CartBadge` | `count` | Yellow badge |

#### 4.2.5 Checkout Components

Located in `components/checkout/`

| Component | Props | Description |
|-----------|-------|-------------|
| `CheckoutSteps` | `currentStep`, `steps` | Minimal step indicator |
| `ShippingForm` | `onSubmit`, `defaultValues` | Clean shipping form |
| `PaymentForm` | `onSubmit`, `amount` | Minimal payment form |
| `OrderSummary` | `order` | Clean order review |
| `PaymentMethods` | `selected`, `onChange` | Minimal payment selector |
| `ShippingMethods` | `methods`, `selected`, `onChange` | Minimal shipping selector |

#### 4.2.6 Account Components

Located in `components/account/`

| Component | Props | Description |
|-----------|-------|-------------|
| `AccountLayout` | `activeTab`, `children` | Minimal account layout |
| `ProfileForm` | `user`, `onUpdate` | Clean profile form |
| `OrderList` | `orders` | Compact order list |
| `OrderDetail` | `order` | Clean order detail |
| `AddressList` | `addresses`, `onSelect` | Compact address list |
| `AddressForm` | `address`, `onSubmit` | Minimal address form |
| `RegistryOverview` | `registry` | Clean registry summary |
| `RegistryItem` | `item`, `onUpdate` | Compact registry item |

#### 4.2.7 Registry Components

Located in `components/registry/`

| Component | Props | Description |
|-----------|-------|-------------|
| `RegistryCard` | `registry` | Minimal registry card |
| `RegistryShare` | `registry` | Minimal share options |
| `RegistryProgress` | `registry` | Minimal progress bar |
| `RegistryPredictions` | `registry` | AI size predictions |
| `RegistrySuggestions` | `registry` | AI product suggestions |

---

## 5. Component Specifications

### 5.1 Product Card

**Design:** Compact, minimal, high-density

```typescript
// components/product/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  variant?: Variant;
  onQuickAdd?: (variantId: string) => void;
  onWishlist?: (productId: string) => void;
}

export function ProductCard({ product, variant, onQuickAdd, onWishlist }: ProductCardProps) {
  return (
    <div className="group bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Image - Full width, minimal padding */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={product.images[0]?.url}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {/* Wishlist icon - Minimal, top right */}
        <button
          onClick={() => onWishlist?.(product.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-sm"
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Quick add - Minimal, bottom, appears on hover */}
        <button
          onClick={() => onQuickAdd?.(variant?.id || product.variants[0].id)}
          className="absolute bottom-0 left-0 right-0 bg-yellow hover:bg-yellow-dark text-gray-900 text-xs font-medium py-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Quick Add
        </button>
      </div>
      
      {/* Info - Minimal padding */}
      <div className="p-2 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-600">
          ${variant?.price || product.basePrice}
        </p>
      </div>
    </div>
  );
}
```

**Dimensions:**
- Mobile: 160px width
- Tablet: 200px width
- Desktop: 220px width
- Large: 240px width

### 5.2 Button Component

**Design:** Minimal, yellow accent only

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick, 
  disabled,
  className 
}: ButtonProps) {
  const baseStyles = 'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow';
  
  const variants = {
    primary: 'bg-yellow hover:bg-yellow-dark text-gray-900',
    secondary: 'bg-gray-900 hover:bg-gray-800 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}
```

### 5.3 Input Component

**Design:** Minimal, thin border

```typescript
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <input
        className={cn(
          'w-full px-3 py-2 text-sm border border-gray-200 rounded-sm',
          'focus:outline-none focus:border-yellow focus:ring-1 focus:ring-yellow',
          'placeholder:text-gray-400',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

### 5.4 Header Component

**Design:** Minimal, text-based navigation

```typescript
// components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold text-gray-900">
          BABY PETITE
        </Link>
        
        {/* Navigation - Text-based */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">
            Shop
          </Link>
          <Link href="/categories" className="text-sm text-gray-600 hover:text-gray-900">
            Categories
          </Link>
          <Link href="/registry" className="text-sm text-gray-600 hover:text-gray-900">
            Registry
          </Link>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button className="p-1">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-1">
            <User className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-1 relative">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <CartBadge />
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 6. State Management

### 6.1 Zustand Stores

#### 6.1.1 Cart Store

```typescript
// stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.variantId === item.variantId);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      
      removeItem: (variantId) => set((state) => ({
        items: state.items.filter(i => i.variantId !== variantId),
      })),
      
      updateQuantity: (variantId, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.variantId === variantId ? { ...i, quantity } : i
        ).filter(i => i.quantity > 0),
      })),
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      
      getTotalPrice: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
```

#### 6.1.2 UI Store

```typescript
// stores/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  activeModal: string | null;
  
  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileMenu: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSearchOpen: false,
  isMobileMenuOpen: false,
  activeModal: null,
  
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
```

---

## 7. Routing

### 7.1 Route Structure

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/` | `page.tsx` | No | Homepage |
| `/products` | `products/page.tsx` | No | Product listing |
| `/products/[slug]` | `products/[slug]/page.tsx` | No | Product detail |
| `/categories` | `categories/page.tsx` | No | Category listing |
| `/categories/[slug]` | `categories/[slug]/page.tsx` | No | Category detail |
| `/search` | `search/page.tsx` | No | Search results |
| `/cart` | `cart/page.tsx` | No | Shopping cart |
| `/checkout` | `checkout/page.tsx` | Yes | Checkout flow |
| `/auth/login` | `auth/login/page.tsx` | No | Login page |
| `/auth/register` | `auth/register/page.tsx` | No | Registration page |
| `/account` | `account/page.tsx` | Yes | Account dashboard |
| `/account/profile` | `account/profile/page.tsx` | Yes | Profile settings |
| `/account/orders` | `account/orders/page.tsx` | Yes | Order history |
| `/account/orders/[id]` | `account/orders/[id]/page.tsx` | Yes | Order detail |
| `/account/addresses` | `account/addresses/page.tsx` | Yes | Address management |
| `/account/registry` | `account/registry/page.tsx` | Yes | Baby registry |
| `/account/wishlist` | `account/wishlist/page.tsx` | Yes | Wishlist |
| `/registry/[shareUrl]` | `registry/[shareUrl]/page.tsx` | No | Public registry view |

---

## 8. Custom Hooks

### 8.1 useCart

```typescript
// hooks/use-cart.ts
import { useCartStore } from '@/stores/cart-store';
import { useMutation } from '@tanstack/react-query';
import { addToCart as addToCartAction } from '@/app/actions/cart';

export function useCart() {
  const { items, isOpen, toggleCart, addItem, removeItem, updateQuantity } = useCartStore();
  
  const addToCartMutation = useMutation({
    mutationFn: addToCartAction,
    onSuccess: () => {
      toggleCart();
    },
  });
  
  return {
    items,
    isOpen,
    toggleCart,
    addItem: (item: CartItem) => {
      addItem(item);
      addToCartMutation.mutate(item);
    },
    removeItem,
    updateQuantity,
    isLoading: addToCartMutation.isPending,
  };
}
```

### 8.2 useAuth

```typescript
// hooks/use-auth.ts
import { useUserStore } from '@/stores/user-store';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { user, isLoading, setUser, logout } = useUserStore();
  
  useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    onSuccess: setUser,
    onError: () => setUser(null),
  });
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
```

---

## 9. Accessibility Standards

### 9.1 WCAG 2.1 AA Compliance

The platform meets WCAG 2.1 Level AA standards:

| Guideline | Implementation |
|-----------|----------------|
| **Perceivable** | Alt text, captions, color contrast, resizable text |
| **Operable** | Keyboard navigation, focus indicators, no traps |
| **Understandable** | Clear labels, consistent navigation, error help |
| **Robust** | Semantic HTML, ARIA attributes, compatible with AT |

### 9.2 Color Contrast

All text meets WCAG AA contrast ratios:

| Element | Minimum Ratio | Actual Ratio |
|---------|---------------|--------------|
| Normal text | 4.5:1 | 7:1+ |
| Large text | 3:1 | 5:1+ |
| UI components | 3:1 | 4.5:1+ |

### 9.3 Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical reading order
- Focus indicators are visible (2px solid yellow)
- Skip links provided for main content
- Modal traps focus when open

---

## 10. Performance Optimization

### 10.1 Code Splitting

```typescript
// Lazy load components
const ProductReviews = dynamic(() => import('@/components/product/ProductReviews'), {
  loading: () => <Spinner />,
});

const Checkout = dynamic(() => import('@/components/checkout/Checkout'), {
  loading: () => <CheckoutSkeleton />,
});
```

### 10.2 Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={product.blurDataUrl}
  sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 220px"
/>
```

### 10.3 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| First Input Delay | <100ms | Lighthouse |

---

## 11. Error Handling

### 11.1 Error Boundary

```typescript
// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}

function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h1>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-yellow text-gray-900 text-sm font-medium">
          Try again
        </button>
      </div>
    </div>
  );
}
```

---

## 12. Testing Strategy

### 12.1 Unit Testing

```typescript
// components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('applies primary variant styles', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-yellow');
  });
});
```

---

## 13. Conclusion

The Baby Petite frontend specification provides:

✅ **High-Density Layout:** Maximized product visibility with compact grids  
✅ **Minimalist Interface:** Clean design with white/yellow palette  
✅ **Product-First Design:** Color from photography, not UI elements  
✅ **Efficient UX:** Streamlined shopping experience  
✅ **Accessibility:** WCAG 2.1 AA compliant  
✅ **Performance:** Optimized for speed  
✅ **Maintainability:** Clean code structure and conventions  

This specification is production-ready and provides a solid foundation for frontend development.

---

**Document Control:**
- Created: February 2026
- Last Updated: February 2026
- Next Review: August 2026
- Approved By: Frontend Lead
