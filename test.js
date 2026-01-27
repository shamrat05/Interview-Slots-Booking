const { chromium } = require('playwright');

async function testInterviewScheduler() {
  console.log('Starting Playwright tests for Interview Scheduler...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });

  try {
    // Test 1: Main page loads
    console.log('Test 1: Loading main page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log(`  Page title: ${title}`);
    
    const header = await page.textContent('h1');
    if (header && header.includes('Interview Scheduler')) {
      console.log('  ✓ Main page loads correctly\n');
      testsPassed++;
    } else {
      console.log('  ✗ Main page failed to load\n');
      testsFailed++;
    }

    // Test 2: Check for available slots section
    console.log('Test 2: Checking for slot selection elements...');
    const dateTabs = await page.locator('button:has-text("Tomorrow"), button:has-text("Mon"), button:has-text("Tue"), button:has-text("Wed"), button:has-text("Thu"), button:has-text("Fri"), button:has-text("Sat"), button:has-text("Sun")').count();
    const slotButtons = await page.locator('button:has-text(":00")').count();
    
    console.log(`  Found ${dateTabs} date tabs`);
    console.log(`  Found ${slotButtons} time slot buttons`);
    
    if (dateTabs > 0 && slotButtons > 0) {
      console.log('  ✓ Slot selection elements present\n');
      testsPassed++;
    } else {
      console.log('  ✗ Slot selection elements missing\n');
      testsFailed++;
    }

    // Test 3: Admin page loads
    console.log('Test 3: Loading admin page...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    
    const adminHeader = await page.textContent('h1');
    if (adminHeader && adminHeader.includes('Admin Login')) {
      console.log('  ✓ Admin page loads correctly\n');
      testsPassed++;
    } else {
      console.log('  ✗ Admin page failed to load\n');
      testsFailed++;
    }

    // Test 4: Admin login functionality
    console.log('Test 4: Testing admin login...');
    const passwordInput = await page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      const dashboardHeader = await page.textContent('h1');
      if (dashboardHeader && dashboardHeader.includes('Admin Dashboard')) {
        console.log('  ✓ Admin login successful\n');
        testsPassed++;
      } else {
        console.log('  ✗ Admin login failed\n');
        testsFailed++;
      }
    } else {
      console.log('  ✗ Password input not found\n');
      testsFailed++;
    }

    // Test 5: Slot clicking opens booking modal
    console.log('Test 5: Testing slot selection modal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const firstSlot = page.locator('button:has-text(":00")').first();
    if (await firstSlot.count() > 0) {
      await firstSlot.click();
      await page.waitForTimeout(500);
      
      const modalTitle = await page.textContent('h3');
      if (modalTitle && modalTitle.includes('Enter Your Details')) {
        console.log('  ✓ Booking modal opens correctly\n');
        testsPassed++;
      } else {
        console.log('  ✗ Booking modal did not open\n');
        testsFailed++;
      }
    } else {
      console.log('  ✗ No slot buttons found\n');
      testsFailed++;
    }

    // Test 6: Form validation
    console.log('Test 6: Testing form validation...');
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder="john@example.com"]', 'test@example.com');
    
    // Click continue
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);
    
    const confirmationTitle = await page.textContent('h3');
    if (confirmationTitle && confirmationTitle.includes('Confirm Your Booking')) {
      console.log('  ✓ Form validation works correctly\n');
      testsPassed++;
    } else {
      console.log('  ✗ Form validation failed\n');
      testsFailed++;
    }

  } catch (error) {
    console.log(`\nTest error: ${error.message}\n`);
    testsFailed++;
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('='.repeat(50));
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));

  return testsFailed === 0;
}

testInterviewScheduler()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
