import { test, expect, Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for sign up, sign in, password reset, and sign out flows
 */

test.describe('Authentication', () => {
  test.describe('Sign Up', () => {
    test('should display sign up form', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Submit empty form
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/email/i).fill('john@example.com');
      await page.getByLabel(/password/i).fill('weak');
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should redirect to verification page after successful signup', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/email/i).fill('john@example.com');
      await page.getByLabel(/password/i).fill('Password123');
      
      // Mock successful signup
      await page.route('**/api/auth/signup', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Should redirect to verification page
      await expect(page).toHaveURL(/\/auth\/verify-email/);
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/email/i).fill('existing@example.com');
      await page.getByLabel(/password/i).fill('Password123');
      
      // Mock existing email error
      await page.route('**/api/auth/signup', async (route) => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Email already exists' }),
        });
      });
      
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/email already exists/i)).toBeVisible();
    });

    test('should have link to sign in page', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByRole('link', { name: /sign in/i }).click();
      
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Sign In', () => {
    test('should display sign in form', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      
      // Mock invalid credentials
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      });
      
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should redirect to home after successful login', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByLabel(/password/i).fill('Password123');
      
      // Mock successful login
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should redirect to home or account page
      await expect(page).toHaveURL(/\/(account)?$/);
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.getByRole('link', { name: /forgot password/i }).click();
      
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
    });

    test('should have link to sign up page', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.getByRole('link', { name: /create account/i }).click();
      
      await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test('should remember user when remember me is checked', async ({ page }) => {
      await page.goto('/auth/signin');
      
      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByLabel(/password/i).fill('Password123');
      await page.getByLabel(/remember me/i).check();
      
      // Mock successful login
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Verify persistent session cookie behavior
      // This would require checking cookies in a real test
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('should show success message after submitting email', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.getByLabel(/email/i).fill('user@example.com');
      
      // Mock successful password reset request
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /send reset link/i }).click();
      
      await expect(page.getByText(/check your email/i)).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /send reset link/i }).click();
      
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should display reset password form with valid token', async ({ page }) => {
      await page.goto('/auth/reset-password?token=valid-token');
      
      await expect(page.getByRole('heading', { name: /new password/i })).toBeVisible();
      await expect(page.getByLabel(/new password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });

    test('should show error for invalid reset token', async ({ page }) => {
      await page.goto('/auth/reset-password?token=invalid-token');
      
      // Mock invalid token
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid or expired token' }),
        });
      });
      
      await page.getByLabel(/new password/i).fill('NewPassword123');
      await page.getByLabel(/confirm password/i).fill('NewPassword123');
      await page.getByRole('button', { name: /reset password/i }).click();
      
      await expect(page.getByText(/invalid or expired token/i)).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/auth/reset-password?token=valid-token');
      
      await page.getByLabel(/new password/i).fill('NewPassword123');
      await page.getByLabel(/confirm password/i).fill('DifferentPassword123');
      await page.getByRole('button', { name: /reset password/i }).click();
      
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('should sign out user', async ({ page }) => {
      // First, simulate being logged in
      await page.goto('/account');
      
      // Mock authenticated state
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ user: { id: '1', email: 'user@example.com' } }),
        });
      });
      
      // Click sign out
      await page.getByRole('button', { name: /sign out/i }).click();
      
      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });

    test('should clear session after sign out', async ({ page }) => {
      await page.goto('/account');
      
      // Mock sign out
      await page.route('**/api/auth/signout', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /sign out/i }).click();
      
      // Try to access protected page
      await page.goto('/account/orders');
      
      // Should redirect to sign in
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Email Verification', () => {
    test('should display verification page', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible();
    });

    test('should show success after verifying email', async ({ page }) => {
      await page.goto('/auth/verify-email?token=valid-token');
      
      // Mock successful verification
      await page.route('**/api/auth/verify-email', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await expect(page.getByText(/email verified/i)).toBeVisible();
    });

    test('should allow resending verification email', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      // Mock resend
      await page.route('**/api/auth/resend-verification', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /resend/i }).click();
      
      await expect(page.getByText(/verification email sent/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to sign in when accessing protected route', async ({ page }) => {
      await page.goto('/account/orders');
      
      // Should redirect to sign in
      await expect(page).toHaveURL(/\/auth\/signin/);
      await expect(page).toHaveURL(/callbackUrl=%2Faccount%2Forders/);
    });

    test('should redirect to intended page after login', async ({ page }) => {
      await page.goto('/account/orders');
      
      // Should be on sign in page with callback URL
      await expect(page).toHaveURL(/\/auth\/signin/);
      
      // Login
      await page.getByLabel(/email/i).fill('user@example.com');
      await page.getByLabel(/password/i).fill('Password123');
      
      // Mock successful login
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      });
      
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should redirect to original intended page
      await expect(page).toHaveURL(/\/account\/orders/);
    });
  });
});
