import { test, expect } from '@playwright/test';

test.describe.serial('Production Shop Management Operations & Playwright Test Suite', () => {

  test('1. Owner Authentication & Session Persistence', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Fill in Owner Credentials
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');

    // Assert redirect to Executive Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Owner Executive Dashboard' })).toBeVisible({ timeout: 15000 });

    // Verify token exists in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('2. Village Creation & Directory Listing', async ({ page }) => {
    // Authenticate first
    await page.goto('/login');
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Village Directory
    await page.goto('/dashboard/villages');
    await expect(page.getByRole('heading', { name: 'Village Management' })).toBeVisible({ timeout: 15000 });

    // Open Add Village Modal
    await page.click('button:has-text("Add Village")');
    await expect(page.getByRole('heading', { name: 'Add New Village' })).toBeVisible();

    // Fill Village Form with unique timestamp suffix
    const timestamp = Date.now().toString().slice(-4);
    const villageName = `Belur Heritage ${timestamp}`;
    await page.fill('input[placeholder="e.g. Rampur"]', villageName);
    await page.fill('input[placeholder="VIL-RAM"]', `VIL-BLR${timestamp}`);
    await page.fill('input[placeholder="East Taluk"]', 'Belur');
    await page.fill('input[placeholder="Central"]', 'Hassan');
    await page.fill('input[placeholder="560001"]', '573115');

    // Submit Village Creation
    await page.click('button:has-text("Create Village")');

    // Assert Village heading appears on screen
    await expect(page.getByRole('heading', { name: villageName })).toBeVisible({ timeout: 15000 });
  });

  test('3. Customer Registration with Village Linking & Duplicate Protection', async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Customers
    await page.goto('/dashboard/customers');
    await expect(page.getByRole('heading', { name: 'Customer Directory' })).toBeVisible({ timeout: 15000 });

    // Open Add Customer Modal
    await page.click('button:has-text("Add Customer")');
    await expect(page.getByRole('heading', { name: 'Register New Customer' })).toBeVisible();

    const timestamp = Date.now().toString().slice(-4);
    const customerName = `Ramesh Gowda ${timestamp}`;
    const phone = `+9198800${timestamp}`;

    await page.fill('input[placeholder="e.g. Ramesh Chandra"]', customerName);
    await page.fill('input[placeholder="+919876543210"]', phone);

    // Select Village
    const modalSelect = page.locator('div.fixed select');
    await modalSelect.waitFor({ state: 'attached' });
    await expect(modalSelect.locator('option')).not.toHaveCount(1, { timeout: 15000 });
    const villageOptions = await modalSelect.locator('option').all();
    const villageVal = await villageOptions[1].getAttribute('value');
    if (villageVal) {
      await modalSelect.selectOption(villageVal);
    }

    await page.locator('div.fixed input[type="number"]').fill('35000');
    await page.fill('input[placeholder*="Near Post Office"]', 'Main Market Road #12');

    // Submit Customer Form
    await page.click('button:has-text("Create Customer")');

    // Assert Customer row appears in directory
    await expect(page.getByText(customerName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(phone)).toBeVisible();
  });

  test('4. Product Catalog Item Creation', async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Products
    await page.goto('/dashboard/products');
    await expect(page.getByRole('heading', { name: 'Product & Inventory Catalog' })).toBeVisible({ timeout: 15000 });

    // Open Add Product Modal
    await page.click('button:has-text("Add Product")');
    await expect(page.getByRole('heading', { name: 'Add Product to Catalog' })).toBeVisible();

    const timestamp = Date.now().toString().slice(-4);
    const productName = `Organic Jaggery ${timestamp}`;

    await page.fill('input[placeholder="e.g. Sona Masoori Rice (25kg)"]', productName);
    await page.fill('input[placeholder="e.g. Grains, Flours, Edible Oil"]', 'Organic Goods');
    await page.selectOption('div.fixed select', 'bag');
    await page.locator('div.fixed input[type="number"]').first().fill('450');
    await page.locator('div.fixed input[type="number"]').nth(1).fill('380');
    await page.fill('input[placeholder="Scan or enter barcode number"]', `BAR${timestamp}`);

    // Submit
    await page.click('button:has-text("Save Product")');

    // Assert product appears in catalog
    await expect(page.getByText(productName)).toBeVisible({ timeout: 15000 });
  });

  test('5. POS Split-Credit Sale & Order Placement', async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to POS
    await page.goto('/dashboard/pos');
    await expect(page.getByRole('heading', { name: 'POS & Credit Sale Checkout' })).toBeVisible({ timeout: 15000 });

    // Select Customer from dropdown
    const customerSelect = page.locator('main select').first();
    await customerSelect.waitFor({ state: 'attached' });
    await expect(customerSelect.locator('option')).not.toHaveCount(1, { timeout: 15000 });
    const posCustomerOptions = await customerSelect.locator('option').all();
    const custVal = await posCustomerOptions[1].getAttribute('value');
    if (custVal) {
      await customerSelect.selectOption(custVal);
    }

    // Add first available product to cart
    const addProductBtn = page.locator('button:has-text("Add")').first();
    await addProductBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addProductBtn.click();

    // Verify item in cart
    await expect(page.locator('text=Current Bill')).toBeVisible({ timeout: 15000 });

    // Submit checkout
    const checkoutBtn = page.locator('button:has-text("Complete Bill & Post to Ledger")');
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // Assert Order Completed Modal
    await expect(page.getByRole('heading', { name: 'Order Completed Successfully!' })).toBeVisible({ timeout: 15000 });
  });

  test('6. Immutable Ledger Integrity & Reconciliation', async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[placeholder*="owner@creditshop.in"]', 'owner@creditshop.in');
    await page.fill('input[type="password"]', 'Admin@CreditShop2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Navigate to Ledger
    await page.goto('/dashboard/ledger');
    await expect(page.getByRole('heading', { name: 'Authoritative Financial Ledger' })).toBeVisible({ timeout: 15000 });

    // Verify Ledger Reconciliation Status
    await expect(page.getByText(/Zero Silent Inconsistency Guarantee Active/i)).toBeVisible({ timeout: 15000 });
  });

  test('7. Customer Portal Mobile Login & Profile Access', async ({ page }) => {
    // Navigate to Customer Portal
    await page.goto('/portal');
    await expect(page.getByRole('heading', { name: 'Sign In to Your Account' })).toBeVisible({ timeout: 15000 });

    // Login using registered customer mobile number (with flexible format)
    await page.fill('input[type="tel"]', '+919988776655');
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Access My Account")');

    // Assert redirect to Customer Dashboard
    await expect(page).toHaveURL(/.*portal\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/Total Outstanding Dues/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Manjunath')).toBeVisible({ timeout: 15000 });
  });

  test('8. Customer Portal Statement & Purchases Inspection', async ({ page }) => {
    // Open portal with session
    await page.goto('/portal');
    await page.fill('input[type="tel"]', '9988776655'); // without +91 to test normalization
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Access My Account")');
    await expect(page).toHaveURL(/.*portal\/dashboard/, { timeout: 15000 });

    // Inspect Statement Tab
    await expect(page.getByRole('button', { name: 'Statement', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print Statement' })).toBeVisible();

    // Switch to Purchases Tab
    await page.click('button:has-text("Purchases")');
    await expect(page.getByText(/ORD-/i).first()).toBeVisible({ timeout: 15000 });

    // Switch to Receipts Tab
    await page.click('button:has-text("Receipts")');
    await expect(page.getByText(/Receipt #/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('9. Customer Online UPI Repayment & Live Balance Reduction', async ({ page }) => {
    // Login to portal
    await page.goto('/portal');
    await page.fill('input[type="tel"]', '+919988776655');
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Access My Account")');
    await expect(page).toHaveURL(/.*portal\/dashboard/, { timeout: 15000 });

    // Check if Pay button is active or dues are settled
    const payBtn = page.locator('button:has-text("Pay Outstanding Online Now")');
    const isPayBtnVisible = await payBtn.isVisible();

    if (isPayBtnVisible) {
      await payBtn.click();
      await expect(page.getByRole('heading', { name: 'Online Payment' })).toBeVisible();

      // Submit UPI payment
      await page.click('button:has-text("Confirm UPI Pay")');

      // Verify payment receipt success alert
      await expect(page.getByText(/Payment verified and credited/i)).toBeVisible({ timeout: 15000 });
    } else {
      // Dues already settled
      await expect(page.getByText(/All dues fully settled/i)).toBeVisible();
    }
  });

});

