const { chromium } = require('playwright');

async function testLevelAxisScheduler() {
  console.log('Starting Playwright tests for LevelAxis Interview Scheduler...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Main page loads with LevelAxis branding
    console.log('Test 1: Loading main page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log(`  Page title: ${title}`);
    
    const header = await page.textContent('h1');
    if (header && header.includes('LevelAxis')) {
      console.log('  ✓ LevelAxis branding found\n');
      testsPassed++;
    } else {
      console.log('  ✗ LevelAxis branding missing\n');
      testsFailed++;
    }

    // Test 2: Check for available slots (supports AM/PM)
    console.log('Test 2: Checking for slot selection elements...');
    const slotButtons = await page.locator('button:has-text("AM"), button:has-text("PM")').count();
    
    console.log(`  Found ${slotButtons} time slot buttons`);
    
    if (slotButtons > 0) {
      console.log('  ✓ Slot buttons present with AM/PM format\n');
      testsPassed++;
    } else {
      console.log('  ✗ Slot buttons missing or wrong format\n');
      testsFailed++;
    }

    // Test 3: Booking modal with new field
    console.log('Test 3: Testing booking modal and Joining Preference field...');
    const firstSlot = page.locator('button:has-text("AM"), button:has-text("PM")').first();
    if (await firstSlot.count() > 0) {
      await firstSlot.click();
      await page.waitForTimeout(500);
      
      const joiningField = await page.locator('input[placeholder*="Immediately"]').count();
      if (joiningField > 0) {
        console.log('  ✓ Joining Preference field found\n');
        testsPassed++;
      } else {
        console.log('  ✗ Joining Preference field missing\n');
        testsFailed++;
      }
    }

    // Test 4: WhatsApp validation for BD format
    console.log('Test 4: Testing step transitions and BD WhatsApp placeholder...');
    await page.fill('input[placeholder="John Doe"]', 'Test Candidate');
    await page.fill('input[placeholder="candidate@levelaxishq.com"]', 'test@levelaxishq.com');
    await page.fill('input[placeholder*="Immediately"]', 'Immediately');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Continue")'); // Confirmation step
    
    const whatsappPlaceholder = await page.getAttribute('input[type="tel"]', 'placeholder');
    if (whatsappPlaceholder && whatsappPlaceholder.includes('+880')) {
      console.log('  ✓ BD WhatsApp format placeholder verified\n');
      testsPassed++;
    } else {
      console.log('  ✗ Wrong WhatsApp placeholder format\n');
      testsFailed++;
    }

  } catch (error) {
    console.log(`\nTest error: ${error.message}\n`);
    testsFailed++;
  } finally {
    await browser.close();
  }

  console.log('='.repeat(50));
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));

  return testsFailed === 0;
}

testLevelAxisScheduler()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });