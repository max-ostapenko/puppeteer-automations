const launchChrome = async () => {
  const puppeteer = require('puppeteer');

  const args = [
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--lang=en-US,en',
  ];

  let chrome;
  try {
    chrome = await puppeteer.launch({
      headless: true,
      devtools: false,
      ignoreHTTPSErrors: true,
      args,
      ignoreDefaultArgs: ['--disable-extensions'],
    });
  } catch (e) {
    console.error('Unable to launch chrome', e);

    return [() => {}, () => {}];
  }

  const exitChrome = async () => {
    if (!chrome) return;
    try {
      await chrome.close();
    } catch (e) {}
  };

  const newPage = async () => {
    try {
      const page = await chrome.newPage();
      const closePage = async () => {
        if (!page) return;
        try {
          await page.close();
        } catch (e) {}
      };
      return [page, closePage];
    } catch (e) {
      console.error('Unable to create a new page');
      return [];
    }
  };

  return [newPage, exitChrome];
};

module.exports = {launchChrome};
