import { test, expect, Page } from '@playwright/test';

/**
 * Baby Registry E2E Tests
 * Tests for create registry, add items, and share registry functionality
 */

test.describe('Baby Registry', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user for registry tests
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

  test.describe('Create Registry', () => {
    test('should display create registry form', async ({ page }) => {
      await page.goto('/registry/create');
      
      await expect(page.getByRole('heading', { name: /create registry/i })).toBeVisible();
      await expect(page.getByLabel(/parent name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/registry/create');
      
      // Submit empty form
      await page.getByRole('button', { name: /create/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should create registry successfully', async ({ page }) => {
      await page.goto('/registry/create');
      
      // Fill form
      await page.getByLabel(/parent name/i).fill('John Doe');
      await page.getByLabel(/partner name/i).fill('Jane Doe');
      await page.getByLabel(/baby name/i).fill('Baby Doe');
      await page.getByLabel(/email/i).fill('john@example.com');
      await page.getByLabel(/due date/i).fill('2024-06-15');
      
      // Mock successful creation
      await page.route('**/api/registry', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
          }),
        });
      });
      
      await page.getByRole('button', { name: /create/i }).click();
      
      // Should redirect to registry page
      await expect(page).toHaveURL(/\/registry\/ABC12345/);
    });

    test('should allow setting privacy options', async ({ page }) => {
      await page.goto('/registry/create');
      
      // Check public/private toggle
      await expect(page.getByLabel(/public registry/i)).toBeVisible();
      
      // Toggle to private
      await page.getByLabel(/public registry/i).uncheck();
      
      // Should show password option for private registry
      await expect(page.getByLabel(/registry password/i)).toBeVisible();
    });

    test('should pre-fill user information', async ({ page }) => {
      await page.goto('/registry/create');
      
      // Email should be pre-filled from session
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('Add Items to Registry', () => {
    test.beforeEach(async ({ page }) => {
      // Mock existing registry
      await page.route('**/api/registry/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            name: 'Baby Doe Registry',
            items: [],
          }),
        });
      });
    });

    test('should display add items interface', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      await expect(page.getByRole('heading', { name: /manage registry/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /add items/i })).toBeVisible();
    });

    test('should search for products to add', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      await page.getByRole('button', { name: /add items/i }).click();
      
      // Search for products
      await page.getByPlaceholder(/search products/i).fill('onesie');
      
      // Mock search results
      await page.route('**/api/products/search*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            products: [
              { id: 'product-1', name: 'Baby Onesie', price: 29.99 },
              { id: 'product-2', name: 'Cotton Onesie Set', price: 39.99 },
            ],
          }),
        });
      });
      
      // Should show search results
      await expect(page.getByText('Baby Onesie')).toBeVisible();
    });

    test('should add product to registry', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Mock product list
      await page.route('**/api/products*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            products: [
              { id: 'product-1', name: 'Baby Onesie', price: 29.99 },
            ],
          }),
        });
      });
      
      // Click add to registry on a product
      await page.getByRole('button', { name: /add to registry/i }).first().click();
      
      // Should show success message
      await expect(page.getByText(/added to registry/i)).toBeVisible();
    });

    test('should set item priority', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Add item with priority
      await page.getByRole('button', { name: /add to registry/i }).first().click();
      
      // Set priority
      await page.getByLabel(/priority/i).selectOption('essential');
      
      // Verify priority is set
      await expect(page.getByText(/essential/i)).toBeVisible();
    });

    test('should set desired quantity', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Add item
      await page.getByRole('button', { name: /add to registry/i }).first().click();
      
      // Set quantity
      await page.getByLabel(/quantity/i).fill('3');
      
      // Verify quantity
      const quantityInput = page.getByLabel(/quantity/i);
      await expect(quantityInput).toHaveValue('3');
    });

    test('should remove item from registry', async ({ page }) => {
      // Mock registry with items
      await page.route('**/api/registry/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            items: [
              { id: 'item-1', productId: 'product-1', productName: 'Baby Onesie', quantity: 2 },
            ],
          }),
        });
      });
      
      await page.goto('/registry/ABC12345/manage');
      
      // Remove item
      await page.getByRole('button', { name: /remove/i }).click();
      
      // Confirm removal
      await page.getByRole('button', { name: /confirm/i }).click();
      
      // Item should be removed
      await expect(page.getByText('Baby Onesie')).not.toBeVisible();
    });
  });

  test.describe('AI Size Prediction', () => {
    test('should show AI recommendations', async ({ page }) => {
      await page.goto('/registry/ABC12345/growth');
      
      await expect(page.getByRole('heading', { name: /size prediction/i })).toBeVisible();
    });

    test('should input baby details for prediction', async ({ page }) => {
      await page.goto('/registry/ABC12345/growth');
      
      // Fill baby details
      await page.getByLabel(/birth date/i).fill('2024-01-15');
      await page.getByLabel(/current weight/i).fill('8');
      await page.getByLabel(/current height/i).fill('20');
      
      // Get predictions
      await page.getByRole('button', { name: /get recommendations/i }).click();
      
      // Mock AI response
      await page.route('**/api/recommendations/registry/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            recommendations: [
              { size: '3-6 months', confidence: 0.85, reason: 'Based on growth trajectory' },
            ],
          }),
        });
      });
      
      // Should show recommendations
      await expect(page.getByText(/3-6 months/i)).toBeVisible();
    });

    test('should add recommended items to registry', async ({ page }) => {
      await page.goto('/registry/ABC12345/growth');
      
      // Mock recommendations
      await page.route('**/api/recommendations/registry/*', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            recommendations: [
              {
                productId: 'product-1',
                productName: 'Baby Onesie 3-6M',
                size: '3-6 months',
                confidence: 0.85,
              },
            ],
          }),
        });
      });
      
      // Add recommended item
      await page.getByRole('button', { name: /add to registry/i }).click();
      
      // Should show success
      await expect(page.getByText(/added to registry/i)).toBeVisible();
    });
  });

  test.describe('Share Registry', () => {
    test('should display share options', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    });

    test('should show shareable link', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      await page.getByRole('button', { name: /share/i }).click();
      
      // Should show share modal
      await expect(page.getByText(/share your registry/i)).toBeVisible();
      
      // Should show shareable link
      const shareLink = page.getByTestId('share-link');
      await expect(shareLink).toBeVisible();
      await expect(shareLink).toHaveValue(/\/registry\/ABC12345/);
    });

    test('should copy share link to clipboard', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      await page.getByRole('button', { name: /share/i }).click();
      await page.getByRole('button', { name: /copy link/i }).click();
      
      // Should show copied confirmation
      await expect(page.getByText(/link copied/i)).toBeVisible();
    });

    test('should share via email', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      await page.getByRole('button', { name: /share/i }).click();
      
      // Click email share
      await page.getByRole('button', { name: /email/i }).click();
      
      // Should open email composer or show email form
      await expect(page.getByLabel(/recipient email/i)).toBeVisible();
    });

    test('should share via social media', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      await page.getByRole('button', { name: /share/i }).click();
      
      // Should show social share buttons
      await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /twitter/i })).toBeVisible();
    });
  });

  test.describe('View Registry (Guest)', () => {
    test('should display public registry', async ({ page }) => {
      // Mock public registry
      await page.route('**/api/registry/ABC12345', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            name: 'Baby Doe Registry',
            parentName: 'John Doe',
            isPublic: true,
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                productName: 'Baby Onesie',
                price: 29.99,
                quantity: 2,
                purchased: 0,
              },
            ],
          }),
        });
      });
      
      await page.goto('/registry/ABC12345');
      
      await expect(page.getByText('Baby Doe Registry')).toBeVisible();
      await expect(page.getByText('Baby Onesie')).toBeVisible();
    });

    test('should show item purchase status', async ({ page }) => {
      await page.route('**/api/registry/ABC12345', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            items: [
              {
                id: 'item-1',
                productName: 'Baby Onesie',
                quantity: 2,
                purchased: 1,
              },
            ],
          }),
        });
      });
      
      await page.goto('/registry/ABC12345');
      
      // Should show purchase progress
      await expect(page.getByText(/1 of 2 purchased/i)).toBeVisible();
    });

    test('should allow purchasing items from registry', async ({ page }) => {
      await page.route('**/api/registry/ABC12345', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                productName: 'Baby Onesie',
                price: 29.99,
                quantity: 2,
                purchased: 0,
              },
            ],
          }),
        });
      });
      
      await page.goto('/registry/ABC12345');
      
      // Click add to cart
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Should add to cart
      await expect(page.getByText(/added to cart/i)).toBeVisible();
    });

    test('should require password for private registry', async ({ page }) => {
      await page.route('**/api/registry/PRIVATE1', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-2',
            shareCode: 'PRIVATE1',
            isPublic: false,
            requiresPassword: true,
          }),
        });
      });
      
      await page.goto('/registry/PRIVATE1');
      
      // Should show password prompt
      await expect(page.getByLabel(/registry password/i)).toBeVisible();
    });

    test('should access private registry with correct password', async ({ page }) => {
      await page.route('**/api/registry/PRIVATE1', async (route) => {
        const request = route.request();
        const body = request.postDataJSON();
        
        if (body?.password === 'correct-password') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              id: 'registry-2',
              shareCode: 'PRIVATE1',
              name: 'Private Registry',
              items: [],
            }),
          });
        } else {
          await route.fulfill({
            status: 401,
            body: JSON.stringify({ error: 'Invalid password' }),
          });
        }
      });
      
      await page.goto('/registry/PRIVATE1');
      
      // Enter password
      await page.getByLabel(/registry password/i).fill('correct-password');
      await page.getByRole('button', { name: /access/i }).click();
      
      // Should show registry
      await expect(page.getByText('Private Registry')).toBeVisible();
    });
  });

  test.describe('Registry Management', () => {
    test('should edit registry details', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Click edit details
      await page.getByRole('button', { name: /edit details/i }).click();
      
      // Update name
      await page.getByLabel(/registry name/i).fill('Updated Registry Name');
      
      // Save
      await page.getByRole('button', { name: /save/i }).click();
      
      // Should show success
      await expect(page.getByText(/registry updated/i)).toBeVisible();
    });

    test('should delete registry', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Click delete
      await page.getByRole('button', { name: /delete registry/i }).click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirm/i }).click();
      
      // Should redirect to registry list
      await expect(page).toHaveURL(/\/registry$/);
    });

    test('should export registry as PDF', async ({ page }) => {
      await page.goto('/registry/ABC12345');
      
      // Click export
      await page.getByRole('button', { name: /export/i }).click();
      
      // Should download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /download pdf/i }).click();
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('should send thank you notes', async ({ page }) => {
      // Mock registry with purchased items
      await page.route('**/api/registry/ABC12345', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'registry-1',
            shareCode: 'ABC12345',
            items: [
              {
                id: 'item-1',
                productName: 'Baby Onesie',
                purchased: 1,
                purchaser: { name: 'Aunt Mary', email: 'mary@example.com' },
              },
            ],
          }),
        });
      });
      
      await page.goto('/registry/ABC12345/manage');
      
      // Click thank you
      await page.getByRole('button', { name: /send thank you/i }).click();
      
      // Should show thank you form
      await expect(page.getByLabel(/message/i)).toBeVisible();
    });
  });

  test.describe('Registry Notifications', () => {
    test('should toggle email notifications', async ({ page }) => {
      await page.goto('/registry/ABC12345/manage');
      
      // Find notification settings
      await page.getByRole('button', { name: /settings/i }).click();
      
      // Toggle notifications
      await page.getByLabel(/email notifications/i).click();
      
      // Should show saved
      await expect(page.getByText(/settings saved/i)).toBeVisible();
    });

    test('should receive notification on purchase', async ({ page }) => {
      // This would be tested via email service integration
      // For E2E, we verify the setting is enabled
      await page.goto('/registry/ABC12345/manage');
      
      await page.getByRole('button', { name: /settings/i }).click();
      
      const notificationToggle = page.getByLabel(/notify on purchase/i);
      await expect(notificationToggle).toBeChecked();
    });
  });
});
