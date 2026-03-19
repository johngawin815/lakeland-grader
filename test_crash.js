const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[Browser PAGE ERROR] ${err.name}: ${err.message}`);
    console.log(err.stack);
  });

  page.on('crash', () => {
    console.log('[Browser CRASH] Page crashed!');
  });

  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // Sign in
    console.log('Waiting for sign in button...');
    await page.waitForSelector('button:has-text("Sign in with Microsoft")');
    await page.click('button:has-text("Sign in with Microsoft")');

    // Wait for Dashboard to load
    console.log('Waiting for Dashboard...');
    await page.waitForSelector('text=Dashboard');
    
    // Click Grades
    console.log('Clicking Grades...');
    await page.click('text=Grades');

    // Wait to see what happens
    console.log('Waiting 5 seconds to capture errors...');
    await page.waitForTimeout(5000);
    
    // Check if ErrorBoundary text is visible
    const errorText = await page.evaluate(() => document.body.innerText);
    if (errorText.includes('Something went wrong in GradingWorkspace')) {
      console.log('ErrorBoundary caught the error! Here is the text:');
      console.log(errorText);
    } else {
      console.log('ErrorBoundary did NOT catch the error. Current DOM text length:', errorText.length);
      console.log('Current DOM text snippet:', errorText.substring(0, 500));
    }
    
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    await browser.close();
  }
})();
