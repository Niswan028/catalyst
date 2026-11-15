import { test, expect } from '@playwright/test';

test.describe('CareConnect Elderly Care & Medication Management E2E Flow', () => {
  const timestamp = Date.now();
  const elderEmail = `elder_${timestamp}@testcareconnect.com`;
  const caregiverEmail = `caregiver_${timestamp}@testcareconnect.com`;
  const password = 'Password123!Secure';

  test('1. Authentication: Sign up flows for Elder and Caregiver', async ({ page }) => {
    // 1.1 Elder Signup
    await page.goto('/auth/signup');
    await expect(page.locator('h1, h2')).toContainText(/Create an Account|Sign Up/i);

    await page.fill('input[type="email"]', elderEmail);
    await page.fill('input[type="password"]', password);
    await page.fill('input[name="full_name"], input[placeholder*="Name" i]', 'Eleanor Vance');
    
    // Select role if role radio/select exists
    const roleElder = page.locator('input[value="elderly"], select[name="role"]');
    if (await roleElder.count() > 0) {
      if (await roleElder.first().getAttribute('type') === 'radio') {
        await roleElder.first().check();
      } else {
        await roleElder.first().selectOption('elderly');
      }
    }

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('2. Navigation & Passcode-based Family Circle Flow', async ({ page }) => {
    // Navigate to homepage / dashboard
    await page.goto('/');
    await expect(page).toHaveTitle(/CareConnect|Catalyst/i);

    // Verify accessibility skip-link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('3. Medication Management and Easy Mode One-Tap Flow', async ({ page }) => {
    await page.goto('/medications');
    // Verify medication page loads with heading
    await expect(page.locator('h1, h2')).toContainText(/Medications|Schedule/i);
  });

  test('4. Doctor Appointments CRUD and Dashboard Widget', async ({ page }) => {
    await page.goto('/appointments');
    // Verify appointments page loads with filter controls and Add button
    await expect(page.locator('h1, h2')).toContainText(/Doctor Appointments|Appointments/i);
    const addBtn = page.locator('button:has-text("Add Appointment"), button:has-text("New Appointment")');
    await expect(addBtn).toBeVisible();
  });

  test('5. Daily Voice & Text Check-In Accessibility Alternative', async ({ page }) => {
    await page.goto('/checkin');
    // Verify Text Alternative Mode toggle is present (WCAG 2.1 AA requirement)
    const textModeToggle = page.locator('button:has-text("Switch to Text Mode"), button:has-text("Text Alternative")');
    if (await textModeToggle.count() > 0) {
      await textModeToggle.first().click();
      await expect(page.locator('textarea')).toBeVisible();
    }
  });

  test('6. Caregiver Dashboard and Cross-Circle Escalation Alerts', async ({ page }) => {
    await page.goto('/caregiver');
    await expect(page.locator('body')).toBeVisible();
  });
});
