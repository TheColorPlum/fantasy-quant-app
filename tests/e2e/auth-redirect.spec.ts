import { test, expect } from '@playwright/test';

test.describe('Auth redirects', () => {
  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from other protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/players',
      '/rosters', 
      '/trades',
      '/proposals',
      '/league-setup',
      '/settings'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('should allow access to public routes', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL('/login');
    
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });
});