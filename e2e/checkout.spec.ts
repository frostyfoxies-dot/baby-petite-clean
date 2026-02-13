import { test, expect, Page } from '@playwright/test';

/**
 * Checkout E2E Tests
 * Tests for add to cart, checkout flow, and order completion
 */

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user for checkout tests
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });
    });
  });

  test.describe('Add to Cart', () => {
    test('should add product to cart from product page', async ({ page }) => {
      await page.goto('/products/baby-onesie');
      
      // Select variant if available
      const sizeButton = page.getByRole('button', { name: /small/i });
      if (await sizeButton.isVisible()) {
        await sizeButton.click();
      }
      
      // Click add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Cart should open or show notification
      await expect(page.getByTestId('cart-drawer')).toBeVisible();
      
      // Verify item in cart
      await expect(page.getByText('Baby Onesie')).toBeVisible();
    });

    test('should update cart quantity', async ({ page }) => {
      await page.goto('/products/baby-onesie');
      
      // Add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Open cart
      await page.getByTestId('cart-icon').click();
      
      // Increase quantity
      const increaseButton = page.getByRole('button', { name: /increase/i });
      await increaseButton.click();
      
      // Verify quantity updated
      await expect(page.getByText('2')).toBeVisible();
    });

    test('should remove item from cart', async ({ page }) => {
      await page.goto('/products/baby-onesie');
      
      // Add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Open cart
      await page.getByTestId('cart-icon').click();
      
      // Remove item
      await page.getByRole('button', { name: /remove/i }).click();
      
      // Verify cart is empty
      await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    });

    test('should persist cart across page navigation', async ({ page }) => {
      await page.goto('/products/baby-onesie');
      
      // Add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Navigate to another page
      await page.goto('/products/baby-socks');
      
      // Open cart
      await page.getByTestId('cart-icon').click();
      
      // Verify item still in cart
      await expect(page.getByText('Baby Onesie')).toBeVisible();
    });

    test('should show cart item count in header', async ({ page }) => {
      await page.goto('/products/baby-onesie');
      
      // Add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Check cart badge
      const cartBadge = page.getByTestId('cart-count');
      await expect(cartBadge).toHaveText('1');
    });
  });

  test.describe('Checkout Process', () => {
    test('should display checkout page with cart items', async ({ page }) => {
      // Setup cart with items
      await page.route('**/api/cart', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                productName: 'Baby Onesie',
                price: 29.99,
                quantity: 2,
              },
            ],
            subtotal: 59.98,
          }),
        });
      });
      
      await page.goto('/checkout');
      
      await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
      await expect(page.getByText('Baby Onesie')).toBeVisible();
      await expect(page.getByText('$59.98')).toBeVisible();
    });

    test('should show checkout steps', async ({ page }) => {
      await page.goto('/checkout');
      
      // Verify checkout steps are visible
      await expect(page.getByText(/shipping/i)).toBeVisible();
      await expect(page.getByText(/payment/i)).toBeVisible();
      await expect(page.getByText(/review/i)).toBeVisible();
    });

    test('should validate shipping address', async ({ page }) => {
      await page.goto('/checkout/shipping');
      
      // Submit empty form
      await page.getByRole('button', { name: /continue/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/address is required/i)).toBeVisible();
      await expect(page.getByText(/city is required/i)).toBeVisible();
    });

    test('should fill shipping address and proceed', async ({ page }) => {
      await page.goto('/checkout/shipping');
      
      // Fill shipping form
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/address/i).fill('123 Main St');
      await page.getByLabel(/city/i).fill('New York');
      await page.getByLabel(/state/i).fill('NY');
      await page.getByLabel(/zip code/i).fill('10001');
      await page.getByLabel(/phone/i).fill('555-123-4567');
      
      // Select shipping method
      await page.getByLabel(/standard shipping/i).check();
      
      // Continue to payment
      await page.getByRole('button', { name: /continue/i }).click();
      
      // Should navigate to payment step
      await expect(page).toHaveURL(/\/checkout\/payment/);
    });

    test('should allow using saved address', async ({ page }) => {
      // Mock saved addresses
      await page.route('**/api/user/addresses', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'address-1',
              name: 'Home',
              line1: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'US',
              isDefault: true,
            },
          ]),
        });
      });
      
      await page.goto('/checkout/shipping');
      
      // Should show saved address option
      await expect(page.getByText(/use saved address/i)).toBeVisible();
      
      // Select saved address
      await page.getByLabel(/home/i).check();
      
      // Continue should work without filling form
      await page.getByRole('button', { name: /continue/i }).click();
    });

    test('should display payment form', async ({ page }) => {
      await page.goto('/checkout/payment');
      
      await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
      await expect(page.getByText(/card number/i)).toBeVisible();
    });

    test('should validate payment details', async ({ page }) => {
      await page.goto('/checkout/payment');
      
      // Submit without payment details
      await page.getByRole('button', { name: /continue/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/payment method required/i)).toBeVisible();
    });

    test('should show order review before completion', async ({ page }) => {
      await page.goto('/checkout/review');
      
      await expect(page.getByRole('heading', { name: /review order/i })).toBeVisible();
      
      // Should show order summary
      await expect(page.getByText(/subtotal/i)).toBeVisible();
      await expect(page.getByText(/shipping/i)).toBeVisible();
      await expect(page.getByText(/total/i)).toBeVisible();
    });
  });

  test.describe('Discount Codes', () => {
    test('should apply valid discount code', async ({ page }) => {
      await page.goto('/checkout');
      
      // Enter discount code
      await page.getByLabel(/discount code/i).fill('SAVE10');
      await page.getByRole('button', { name: /apply/i }).click();
      
      // Mock successful discount
      await page.route('**/api/cart/discount', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            discount: 10,
            discountCode: 'SAVE10',
          }),
        });
      });
      
      // Should show discount applied
      await expect(page.getByText(/discount applied/i)).toBeVisible();
      await expect(page.getByText(/-\$10.00/i)).toBeVisible();
    });

    test('should show error for invalid discount code', async ({ page }) => {
      await page.goto('/checkout');
      
      // Enter invalid code
      await page.getByLabel(/discount code/i).fill('INVALID');
      await page.getByRole('button', { name: /apply/i }).click();
      
      // Mock invalid code
      await page.route('**/api/cart/discount', async (route) => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid discount code' }),
        });
      });
      
      // Should show error
      await expect(page.getByText(/invalid discount code/i)).toBeVisible();
    });

    test('should remove applied discount', async ({ page }) => {
      await page.goto('/checkout');
      
      // Apply discount first
      await page.getByLabel(/discount code/i).fill('SAVE10');
      await page.getByRole('button', { name: /apply/i }).click();
      
      // Remove discount
      await page.getByRole('button', { name: /remove discount/i }).click();
      
      // Discount should be removed
      await expect(page.getByText(/-\$10.00/i)).not.toBeVisible();
    });
  });

  test.describe('Order Completion', () => {
    test('should complete order successfully', async ({ page }) => {
      await page.goto('/checkout/review');
      
      // Mock successful order
      await page.route('**/api/checkout', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            orderId: 'KP-2024-ABC123',
            status: 'confirmed',
          }),
        });
      });
      
      // Place order
      await page.getByRole('button', { name: /place order/i }).click();
      
      // Should redirect to success page
      await expect(page).toHaveURL(/\/checkout\/success/);
    });

    test('should show order confirmation', async ({ page }) => {
      await page.goto('/checkout/success?order=KP-2024-ABC123');
      
      await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible();
      await expect(page.getByText('KP-2024-ABC123')).toBeVisible();
      await expect(page.getByText(/order confirmed/i)).toBeVisible();
    });

    test('should show estimated delivery date', async ({ page }) => {
      await page.goto('/checkout/success?order=KP-2024-ABC123');
      
      await expect(page.getByText(/estimated delivery/i)).toBeVisible();
    });

    test('should show order details on success page', async ({ page }) => {
      // Mock order details
      await page.route('**/api/orders/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            orderNumber: 'KP-2024-ABC123',
            items: [
              { productName: 'Baby Onesie', quantity: 2, price: 29.99 },
            ],
            total: 59.98,
          }),
        });
      });
      
      await page.goto('/checkout/success?order=KP-2024-ABC123');
      
      await expect(page.getByText('Baby Onesie')).toBeVisible();
    });

    test('should handle payment failure gracefully', async ({ page }) => {
      await page.goto('/checkout/review');
      
      // Mock payment failure
      await page.route('**/api/checkout', async (route) => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Payment failed' }),
        });
      });
      
      await page.getByRole('button', { name: /place order/i }).click();
      
      // Should show error message
      await expect(page.getByText(/payment failed/i)).toBeVisible();
      
      // Should stay on review page
      await expect(page).toHaveURL(/\/checkout\/review/);
    });
  });

  test.describe('Guest Checkout', () => {
    test('should allow guest checkout', async ({ page }) => {
      // Clear auth mock for guest
      await page.unroute('**/api/auth/session');
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ user: null }),
        });
      });
      
      await page.goto('/checkout');
      
      // Should show guest checkout option
      await expect(page.getByText(/continue as guest/i)).toBeVisible();
    });

    test('should prompt for email in guest checkout', async ({ page }) => {
      await page.unroute('**/api/auth/session');
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ user: null }),
        });
      });
      
      await page.goto('/checkout');
      
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should offer account creation after guest checkout', async ({ page }) => {
      await page.unroute('**/api/auth/session');
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ user: null }),
        });
      });
      
      await page.goto('/checkout/success?order=KP-2024-ABC123');
      
      await expect(page.getByText(/create an account/i)).toBeVisible();
    });
  });

  test.describe('Mobile Checkout', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile-friendly checkout', async ({ page }) => {
      await page.goto('/checkout');
      
      // Should show mobile cart summary toggle
      await expect(page.getByTestId('mobile-cart-summary')).toBeVisible();
    });

    test('should collapse cart summary on mobile', async ({ page }) => {
      await page.goto('/checkout');
      
      // Cart summary should be collapsed by default
      const cartSummary = page.getByTestId('cart-items-list');
      await expect(cartSummary).not.toBeVisible();
      
      // Tap to expand
      await page.getByTestId('mobile-cart-summary').click();
      
      // Should expand
      await expect(cartSummary).toBeVisible();
    });
  });
});
