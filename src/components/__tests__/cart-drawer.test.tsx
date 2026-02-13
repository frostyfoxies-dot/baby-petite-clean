import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartDrawer, CartItemData, CartSummaryData } from '../cart/cart-drawer';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

// Mock UI components
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ isOpen, onClose, title, children }: any) => (
    <div data-testid="drawer" data-open={isOpen}>
      {isOpen && (
        <>
          <div data-testid="drawer-title">{title}</div>
          <button onClick={onClose} aria-label="Close drawer">Close</button>
          {children}
        </>
      )}
    </div>
  ),
  DrawerHeader: ({ children }: any) => <div data-testid="drawer-header">{children}</div>,
  DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
  DrawerFooter: ({ children }: any) => <div data-testid="drawer-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, loading, className, variant }: any) => (
    <button onClick={onClick} disabled={loading} className={className} data-variant={variant}>
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

vi.mock('../cart/cart-item', () => ({
  CartItem: ({ item, onUpdateQuantity, onRemove }: any) => (
    <div data-testid={`cart-item-${item.id}`}>
      <span>{item.productName}</span>
      <span>{item.quantity}</span>
      <button onClick={() => onUpdateQuantity(item.quantity + 1)}>Increase</button>
      <button onClick={() => onRemove()}>Remove</button>
    </div>
  ),
}));

vi.mock('../cart/cart-summary', () => ({
  CartSummary: ({ summary }: any) => (
    <div data-testid="cart-summary">
      <span>Subtotal: ${summary.subtotal}</span>
      <span>Total: ${summary.total}</span>
    </div>
  ),
}));

vi.mock('../cart/empty-cart', () => ({
  EmptyCart: ({ onClose }: any) => (
    <div data-testid="empty-cart">
      <span>Your cart is empty</span>
      <button onClick={onClose}>Continue Shopping</button>
    </div>
  ),
}));

describe('CartDrawer', () => {
  const mockItems: CartItemData[] = [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Baby Onesie',
      productSlug: 'baby-onesie',
      productImage: 'https://example.com/image1.jpg',
      variantName: 'Small - Blue',
      price: 29.99,
      quantity: 2,
    },
    {
      id: 'item-2',
      productId: 'product-2',
      productName: 'Baby Socks',
      productSlug: 'baby-socks',
      productImage: 'https://example.com/image2.jpg',
      price: 9.99,
      quantity: 3,
    },
  ];

  const mockSummary: CartSummaryData = {
    subtotal: 89.95,
    tax: 7.20,
    shipping: 5.99,
    total: 103.14,
  };

  const mockOnClose = vi.fn();
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      expect(screen.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    });

    it('should not render content when closed', () => {
      render(
        <CartDrawer
          isOpen={false}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByTestId('drawer')).toHaveAttribute('data-open', 'false');
      expect(screen.queryByTestId('drawer-title')).not.toBeInTheDocument();
    });

    it('should display cart title with item count', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument(); // 2 + 3 items
    });

    it('should display cart items', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-item-2')).toBeInTheDocument();
    });

    it('should display cart summary', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByText(/Subtotal: \$89.95/)).toBeInTheDocument();
      expect(screen.getByText(/Total: \$103.14/)).toBeInTheDocument();
    });
  });

  describe('empty cart', () => {
    it('should show empty cart message when no items', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={[]}
          summary={{ subtotal: 0, tax: 0, shipping: 0, total: 0 }}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByTestId('empty-cart')).toBeInTheDocument();
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should not show footer when cart is empty', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={[]}
          summary={{ subtotal: 0, tax: 0, shipping: 0, total: 0 }}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
    });

    it('should call onClose when continue shopping clicked in empty cart', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={[]}
          summary={{ subtotal: 0, tax: 0, shipping: 0, total: 0 }}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      fireEvent.click(screen.getByText('Continue Shopping'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('drawer controls', () => {
    it('should call onClose when close button clicked', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      fireEvent.click(screen.getByLabelText('Close drawer'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('item interactions', () => {
    it('should call onUpdateQuantity when quantity is updated', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      // Click increase button on first item
      const increaseButtons = screen.getAllByText('Increase');
      fireEvent.click(increaseButtons[0]);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith('item-1', 3);
    });

    it('should call onRemoveItem when item is removed', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      // Click remove button on first item
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('checkout', () => {
    it('should show checkout button when items exist', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onCheckout={mockOnCheckout}
        />
      );

      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });

    it('should call onCheckout when checkout button clicked', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onCheckout={mockOnCheckout}
        />
      );

      fireEvent.click(screen.getByText('Checkout'));
      expect(mockOnCheckout).toHaveBeenCalled();
    });

    it('should show loading state on checkout button', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onCheckout={mockOnCheckout}
          isCheckoutLoading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show continue shopping button', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    it('should call onClose when continue shopping clicked', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      // There are two "Continue Shopping" buttons - one in footer, one in empty cart
      // We want the one in the footer (first one when items exist)
      const continueButtons = screen.getAllByText('Continue Shopping');
      fireEvent.click(continueButtons[0]);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('item count calculation', () => {
    it('should calculate total item count correctly', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      // 2 items + 3 items = 5 total
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('should not show count when cart is empty', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={[]}
          summary={{ subtotal: 0, tax: 0, shipping: 0, total: 0 }}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      // The count should not be displayed for empty cart
      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have close button with accessible label', () => {
      render(
        <CartDrawer
          isOpen={true}
          onClose={mockOnClose}
          items={mockItems}
          summary={mockSummary}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      expect(screen.getByLabelText('Close drawer')).toBeInTheDocument();
    });
  });
});
