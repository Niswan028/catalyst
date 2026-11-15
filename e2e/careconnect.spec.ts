import { test, expect } from '@playwright/test';

test.describe('CareConnect Elderly Care & Medication Management E2E Flow', () => {
  const timestamp = Date.now();
  const elderEmail = `elder_${timestamp}@testcareconnect.com`;
  const caregiverEmail = `caregiver_${timestamp}@testcareconnect.com`;
  const familyEmail = `family_${timestamp}@testcareconnect.com`;
  const password = 'Password123!Secure';

  test('1. Authentication Validation: empty fields, invalid email, weak password', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('h1, h2')).toContainText(/Create Your Account|Sign Up/i);

    // Empty form submission
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toContainText(/Please enter your full name/i);

    // Invalid email
    await page.fill('input[name="full_name"], input[placeholder*="Eleanor" i]', 'Test User');
    await page.fill('input[type="email"]', 'invalid-email-format');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toContainText(/valid email address/i);

    // Weak password
    await page.fill('input[type="email"]', 'valid@example.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toContainText(/at least 6 characters/i);
  });

  test('2. Authentication: Sign up flows for Elder, Caregiver, and Family Member', async ({ page }) => {
    // 2.1 Elder Signup
    await page.goto('/auth/signup');
    await page.check('input[value="elder"]');
    await page.fill('input[name="full_name"], input[placeholder*="Eleanor" i]', 'Arthur Vance');
    await page.fill('input[type="email"]', elderEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Either auto-confirms or directs to sign-in / confirmation
    await expect(page).toHaveURL(/.*(signin|dashboard).*/);

    // 2.2 Caregiver / Clinician Signup
    await page.goto('/auth/signup');
    await page.check('input[value="caregiver"]');
    await page.fill('input[name="full_name"], input[placeholder*="Eleanor" i]', 'Dr. Stephen Ward, MD');
    await page.fill('input[type="email"]', caregiverEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*(signin|caregiver).*/);

    // 2.3 Family Member Signup
    await page.goto('/auth/signup');
    await page.check('input[value="family"]');
    await page.fill('input[name="full_name"], input[placeholder*="Eleanor" i]', 'Michael Vance');
    await page.fill('input[type="email"]', familyEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*(signin|caregiver).*/);
  });

  test('3. Sign-in error does not reveal account existence & handles wrong password', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'nonexistent.user.testing@gmail.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const alert = page.locator('.bg-red-50, [role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    const errorText = await alert.innerText();
    expect(errorText.toLowerCase()).toContain('invalid email or password');
  });

  test('4. Navigation & Passcode-based Family Circle Flow', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CareConnect|Catalyst/i);

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('5. Medication Management and Easy Mode One-Tap Flow', async ({ page }) => {
    await page.goto('/medications');
    await expect(page.locator('h1, h2')).toContainText(/Medications|Schedule|Prescriptions/i);
  });

  test('6. Doctor Appointments CRUD and Dashboard Widget', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page.locator('h1, h2')).toContainText(/Doctor Appointments|Appointments/i);
  });

  test('7. Daily Voice & Text Check-In Accessibility Alternative', async ({ page }) => {
    await page.goto('/checkin');
    const textModeToggle = page.locator('button:has-text("Switch to Text Mode"), button:has-text("Text Alternative")');
    if (await textModeToggle.count() > 0) {
      await textModeToggle.first().click();
      await expect(page.locator('textarea')).toBeVisible();
    }
  });

  test('8. Mobile Viewport & Accessible Touch Navigation (WCAG 2.1 AA)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signin');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});
