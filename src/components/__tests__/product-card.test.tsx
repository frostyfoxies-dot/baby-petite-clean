import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard, Product } from '../product/product-card';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className, onMouseEnter, onMouseLeave }: any) => (
    <a href={href} className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, className, onError, sizes }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={onError}
      data-fill={fill}
      data-sizes={sizes}
    />
  ),
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Baby Onesie',
    slug: 'baby-onesie',
    description: 'A comfortable baby onesie',
    images: [{ url: 'https://example.com/image.jpg', alt: 'Baby Onesie' }],
    price: 29.99,
    rating: 4.5,
    reviewCount: 10,
    category: 'Onesies',
  };

  const mockOnQuickAdd = vi.fn();
  const mockOnWishlist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render product name', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('Baby Onesie')).toBeInTheDocument();
    });

    it('should render product price', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText(/\$29.99/)).toBeInTheDocument();
    });

    it('should render product category', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('Onesies')).toBeInTheDocument();
    });

    it('should render product image', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const image = screen.getByAltText('Baby Onesie');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should render rating stars', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      // Rating of 4.5 should show 5 stars (4 filled, 1 empty)
      const stars = screen.getAllByRole('img', { hidden: true });
      expect(stars.length).toBeGreaterThan(0);
    });

    it('should render review count', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('(10)')).toBeInTheDocument();
    });

    it('should link to product page', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/baby-onesie');
    });
  });

  describe('sale price', () => {
    it('should render sale price when on sale', () => {
      const saleProduct = {
        ...mockProduct,
        salePrice: 19.99,
        isOnSale: true,
      };

      render(
        <ProductCard
          product={saleProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText(/\$19.99/)).toBeInTheDocument();
      expect(screen.getByText(/\$29.99/)).toBeInTheDocument();
    });

    it('should show discount percentage', () => {
      const saleProduct = {
        ...mockProduct,
        salePrice: 19.99,
        isOnSale: true,
      };

      render(
        <ProductCard
          product={saleProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      // 33% discount (29.99 -> 19.99)
      expect(screen.getByText(/-33%/)).toBeInTheDocument();
    });
  });

  describe('badges', () => {
    it('should show "New" badge for new products', () => {
      const newProduct = { ...mockProduct, isNew: true };

      render(
        <ProductCard
          product={newProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should show "Out of Stock" badge for out of stock products', () => {
      const outOfStockProduct = { ...mockProduct, isOutOfStock: true };

      render(
        <ProductCard
          product={outOfStockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });
  });

  describe('quick add functionality', () => {
    it('should call onQuickAdd when quick add button is clicked', async () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      // Hover to show quick add button
      const card = screen.getByRole('link');
      fireEvent.mouseEnter(card);

      // Click quick add button
      const quickAddButton = screen.getByLabelText('Quick add to cart');
      fireEvent.click(quickAddButton);

      expect(mockOnQuickAdd).toHaveBeenCalledWith('product-1');
    });

    it('should not show quick add button when showQuickAdd is false', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
          showQuickAdd={false}
        />
      );

      expect(screen.queryByLabelText('Quick add to cart')).not.toBeInTheDocument();
    });

    it('should not show quick add button for out of stock products', () => {
      const outOfStockProduct = { ...mockProduct, isOutOfStock: true };

      render(
        <ProductCard
          product={outOfStockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.queryByLabelText('Quick add to cart')).not.toBeInTheDocument();
    });

    it('should use variant ID when variant is provided', () => {
      const variant = {
        id: 'variant-1',
        name: 'Small - Blue',
        stock: 10,
      };

      render(
        <ProductCard
          product={mockProduct}
          variant={variant}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const card = screen.getByRole('link');
      fireEvent.mouseEnter(card);

      const quickAddButton = screen.getByLabelText('Quick add to cart');
      fireEvent.click(quickAddButton);

      expect(mockOnQuickAdd).toHaveBeenCalledWith('variant-1');
    });
  });

  describe('wishlist functionality', () => {
    it('should call onWishlist when wishlist button is clicked', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const wishlistButton = screen.getByLabelText('Add to wishlist');
      fireEvent.click(wishlistButton);

      expect(mockOnWishlist).toHaveBeenCalledWith('product-1');
    });

    it('should show filled heart when wishlisted', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
          isWishlisted={true}
        />
      );

      const wishlistButton = screen.getByLabelText('Remove from wishlist');
      expect(wishlistButton).toBeInTheDocument();
    });

    it('should not show wishlist button when showWishlist is false', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
          showWishlist={false}
        />
      );

      expect(screen.queryByLabelText('Add to wishlist')).not.toBeInTheDocument();
    });
  });

  describe('rating display', () => {
    it('should not show rating when showRating is false', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
          showRating={false}
        />
      );

      expect(screen.queryByText('(10)')).not.toBeInTheDocument();
    });

    it('should handle missing rating', () => {
      const productWithoutRating = { ...mockProduct, rating: undefined, reviewCount: undefined };

      render(
        <ProductCard
          product={productWithoutRating}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.queryByText('(10)')).not.toBeInTheDocument();
    });
  });

  describe('image handling', () => {
    it('should show placeholder when image fails to load', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const image = screen.getByAltText('Baby Onesie');
      fireEvent.error(image);

      expect(screen.getByText('No image')).toBeInTheDocument();
    });

    it('should handle product without images', () => {
      const productWithoutImages = { ...mockProduct, images: [] };

      render(
        <ProductCard
          product={productWithoutImages}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('No image')).toBeInTheDocument();
    });
  });

  describe('variant handling', () => {
    it('should display variant price when provided', () => {
      const variant = {
        id: 'variant-1',
        name: 'Small - Blue',
        price: 39.99,
        stock: 10,
      };

      render(
        <ProductCard
          product={mockProduct}
          variant={variant}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText(/\$39.99/)).toBeInTheDocument();
    });

    it('should show variant stock status', () => {
      const outOfStockVariant = {
        id: 'variant-1',
        name: 'Small - Blue',
        stock: 0,
      };

      render(
        <ProductCard
          product={mockProduct}
          variant={outOfStockVariant}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible wishlist button label', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
    });

    it('should have accessible wishlist button label when wishlisted', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
          isWishlisted={true}
        />
      );

      expect(screen.getByLabelText('Remove from wishlist')).toBeInTheDocument();
    });

    it('should have accessible quick add button label', () => {
      render(
        <ProductCard
          product={mockProduct}
          onQuickAdd={mockOnQuickAdd}
          onWishlist={mockOnWishlist}
        />
      );

      const card = screen.getByRole('link');
      fireEvent.mouseEnter(card);

      expect(screen.getByLabelText('Quick add to cart')).toBeInTheDocument();
    });
  });
});
