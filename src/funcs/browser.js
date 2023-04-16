const launchBrowser = async () => {
  const puppeteer = require('puppeteer');

  const args = [
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--lang=en-US,en',
  ];

  // let browserURL = 'ws://127.0.0.1:9222/devtools/browser/d439787d-6143-40ea-b6d2-c53fd9131583';
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      ignoreHTTPSErrors: true,
      args,
      ignoreDefaultArgs: ['--disable-extensions'],
      // browserWSEndpoint: browserURL,
    });
    return browser;
  } catch (e) {
    console.error('Unable to launch browser', e);
  }
};

module.exports = {launchBrowser};
